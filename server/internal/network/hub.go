package network

import (
	"log"
	"sync"
	"sync/atomic"
	"time"

	"github.com/evo-sphere/server/internal/engine"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	clients    map[*Client]bool
	clientsMu  sync.RWMutex // Protects clients map
	register   chan *Client
	unregister chan *Client
	universe   *engine.Universe
	scheduler  *engine.Scheduler

	players   map[string]*Client
	playersMu sync.RWMutex

	connectedCount atomic.Int32
}

// NewHub creates a new Hub
func NewHub(universe *engine.Universe) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client, 16),
		unregister: make(chan *Client, 16),
		universe:   universe,
		scheduler:  engine.NewScheduler(universe, 1000*time.Millisecond), // 1秒1代
		players:    make(map[string]*Client),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	// Start the evolution scheduler
	h.scheduler.Start(func(diffs []engine.CellDiff, generation, population uint32) {
		if len(diffs) > 0 {
			h.BroadcastCellUpdates(diffs, generation, population)
		}
	})

	// 设置重置回调
	h.scheduler.SetOnReset(func() {
		h.BroadcastSnapshotToAll()
		log.Println("World auto-reset triggered")
	})

	for {
		select {
		case client := <-h.register:
			h.handleRegister(client)

		case client := <-h.unregister:
			h.handleUnregister(client)
		}
	}
}

// BroadcastSnapshotToAll sends snapshot to all clients
func (h *Hub) BroadcastSnapshotToAll() {
	h.clientsMu.RLock()
	for client := range h.clients {
		h.sendSnapshot(client)
	}
	h.clientsMu.RUnlock()
}

// handleRegister handles client registration
func (h *Hub) handleRegister(client *Client) {
	h.clientsMu.Lock()
	h.clients[client] = true
	h.connectedCount.Add(1)

	// Register player
	if client.playerID != "" {
		h.playersMu.Lock()
		h.players[client.playerID] = client
		h.playersMu.Unlock()

		// Broadcast player join to others (already holding clientsMu.Lock)
		joinMsg := EncodePlayerJoin(client.playerID, client.playerName, client.playerColor)
		for c := range h.clients {
			if c != client {
				select {
				case c.send <- joinMsg:
				default:
				}
			}
		}
	}
	h.clientsMu.Unlock()

	log.Printf("Client connected: %s (Total: %d)", client.playerID, h.connectedCount.Load())

	// Send initial world config (1000x1000 world)
	configMsg := EncodeWorldConfig(1000, 8, 100000)
	client.send <- configMsg

	// Send initial snapshot
	h.sendSnapshot(client)
}

// handleUnregister handles client disconnection
func (h *Hub) handleUnregister(client *Client) {
	h.clientsMu.Lock()
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		h.connectedCount.Add(-1)
		close(client.send)

		// Remove player and broadcast leave
		if client.playerID != "" {
			h.playersMu.Lock()
			delete(h.players, client.playerID)
			h.playersMu.Unlock()

			// Broadcast player leave (already holding clientsMu.Lock)
			leaveMsg := EncodePlayerLeave(client.playerID)
			for c := range h.clients {
				select {
				case c.send <- leaveMsg:
				default:
				}
			}
		}

		log.Printf("Client disconnected: %s (Total: %d)", client.playerID, h.connectedCount.Load())
	}
	h.clientsMu.Unlock()
}

// sendSnapshot sends a full snapshot to a client
func (h *Hub) sendSnapshot(client *Client) {
	// Get cells in client's viewport if set, otherwise all cells
	var cells []engine.CellDiff
	if client.viewport.X1 != 0 || client.viewport.X2 != 0 {
		cells = h.universe.GetCellsInViewport(
			client.viewport.X1/8, client.viewport.Y1/8,
			client.viewport.X2/8, client.viewport.Y2/8,
		)
	} else {
		cells = h.universe.GetCells()
	}

	generation := h.universe.Generation()
	population := h.universe.Population()

	snapshot := EncodeSnapshot(cells, generation, population)
	client.send <- snapshot
}

// BroadcastCellUpdates broadcasts cell updates to all clients
func (h *Hub) BroadcastCellUpdates(diffs []engine.CellDiff, generation, population uint32) {
	if len(diffs) == 0 {
		return
	}

	h.clientsMu.RLock()
	for client := range h.clients {
		// AOI filtering: only send cells in client's viewport
		if client.viewport.X1 != 0 || client.viewport.X2 != 0 {
			filteredDiffs := h.filterDiffsByViewport(diffs, client.viewport)
			if len(filteredDiffs) > 0 {
				filteredMsg := EncodeCellUpdate(filteredDiffs)
				select {
				case client.send <- filteredMsg:
				default:
					// Client buffer full, skip
				}
			}
		} else {
			// No viewport set, send all
			msg := EncodeCellUpdate(diffs)
			select {
			case client.send <- msg:
			default:
				// Client buffer full, skip
			}
		}
	}
	h.clientsMu.RUnlock()
}

// filterDiffsByViewport filters cell diffs by viewport
func (h *Hub) filterDiffsByViewport(diffs []engine.CellDiff, viewport Viewport) []engine.CellDiff {
	// Convert viewport from screen coords to cell coords
	x1, y1 := viewport.X1/8, viewport.Y1/8
	x2, y2 := viewport.X2/8, viewport.Y2/8

	filtered := make([]engine.CellDiff, 0, len(diffs))
	for _, diff := range diffs {
		if diff.X >= x1 && diff.X <= x2 && diff.Y >= y1 && diff.Y <= y2 {
			filtered = append(filtered, diff)
		}
	}
	return filtered
}

// SetCell sets a cell in the universe
func (h *Hub) SetCell(x, y int32, state engine.CellState) {
	h.universe.SetCell(x, y, state)
}

// ToggleCell toggles a cell
func (h *Hub) ToggleCell(x, y int32) engine.CellState {
	return h.universe.ToggleCell(x, y)
}

// ClearWorld clears the universe
func (h *Hub) ClearWorld() {
	h.universe.Clear()
	// Broadcast clear to all clients
	h.clientsMu.RLock()
	for client := range h.clients {
		h.sendSnapshot(client)
	}
	h.clientsMu.RUnlock()
}

// Randomize randomizes the universe
func (h *Hub) Randomize() {
	h.universe.Randomize(0.15, 0, 0, 200)
	// Broadcast to all clients
	h.clientsMu.RLock()
	for client := range h.clients {
		h.sendSnapshot(client)
	}
	h.clientsMu.RUnlock()
}

// SetSpeed sets the simulation speed
func (h *Hub) SetSpeed(fps uint32) {
	if fps < 1 {
		fps = 1
	} else if fps > 60 {
		fps = 60
	}
	interval := time.Duration(1000/fps) * time.Millisecond
	h.scheduler.SetTickInterval(interval)
}

// TogglePause toggles pause state
func (h *Hub) TogglePause() bool {
	return h.scheduler.TogglePause()
}

// IsPaused returns true if paused
func (h *Hub) IsPaused() bool {
	return h.scheduler.IsPaused()
}

// Step performs a single step
func (h *Hub) Step() []engine.CellDiff {
	return h.scheduler.Step()
}

// BroadcastPlayerCursor broadcasts a player's cursor position
func (h *Hub) BroadcastPlayerCursor(playerID string, x, y int32) {
	msg := EncodePlayerCursor(playerID, x, y)
	h.clientsMu.RLock()
	for client := range h.clients {
		if client.playerID != playerID {
			select {
			case client.send <- msg:
			default:
			}
		}
	}
	h.clientsMu.RUnlock()
}

// GetConnectedCount returns the number of connected clients
func (h *Hub) GetConnectedCount() int {
	return int(h.connectedCount.Load())
}

// GetGeneration returns the current generation
func (h *Hub) GetGeneration() uint32 {
	return h.universe.Generation()
}

// GetPopulation returns the current population
func (h *Hub) GetPopulation() uint32 {
	return h.universe.Population()
}
