package network

import (
	"github.com/evo-sphere/server/internal/engine"
)

// AOI (Area of Interest) Manager
// Handles filtering cells based on client viewports

type AOIManager struct {
	clients map[*Client]Viewport
}

func NewAOIManager() *AOIManager {
	return &AOIManager{
		clients: make(map[*Client]Viewport),
	}
}

func (m *AOIManager) UpdateViewport(client *Client, viewport Viewport) {
	m.clients[client] = viewport
}

func (m *AOIManager) RemoveClient(client *Client) {
	delete(m.clients, client)
}

func (m *AOIManager) FilterCellsForClient(client *Client, cells []engine.CellDiff) []engine.CellDiff {
	viewport, ok := m.clients[client]
	if !ok {
		return cells
	}

	filtered := make([]engine.CellDiff, 0)
	for _, cell := range cells {
		if cell.X >= viewport.X1 && cell.X <= viewport.X2 &&
			cell.Y >= viewport.Y1 && cell.Y <= viewport.Y2 {
			filtered = append(filtered, cell)
		}
	}

	return filtered
}

func (m *AOIManager) FilterDiffsForClient(client *Client, diffs []engine.CellDiff) []engine.CellDiff {
	viewport, ok := m.clients[client]
	if !ok {
		return diffs
	}

	filtered := make([]engine.CellDiff, 0)
	for _, diff := range diffs {
		if diff.X >= viewport.X1 && diff.X <= viewport.X2 &&
			diff.Y >= viewport.Y1 && diff.Y <= viewport.Y2 {
			filtered = append(filtered, diff)
		}
	}

	return filtered
}

// IsInViewport checks if a coordinate is within a viewport
func IsInViewport(x, y int32, viewport Viewport) bool {
	return x >= viewport.X1 && x <= viewport.X2 &&
		y >= viewport.Y1 && y <= viewport.Y2
}
