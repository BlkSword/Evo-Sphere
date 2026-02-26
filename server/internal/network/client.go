package network

import (
	"log"
	"net/http"
	"time"

	"github.com/evo-sphere/server/internal/engine"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// Viewport represents a client's view area
type Viewport struct {
	X1, Y1, X2, Y2 int32
}

// Client represents a connected client
type Client struct {
	hub         *Hub
	conn        *websocket.Conn
	send        chan []byte
	viewport    Viewport
	playerID    string
	playerName  string
	playerColor string
}

// NewClient creates a new client
func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
	}
}

// readPump pumps messages from the websocket connection to the hub
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		c.handleMessage(message)
	}
}

// writePump pumps messages from the hub to the websocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.BinaryMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Batch messages
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage handles incoming messages
func (c *Client) handleMessage(message []byte) {
	if len(message) < 1 {
		return
	}

	msgType := message[0]

	switch msgType {
	case MsgTypeHeartbeat:
		// Heartbeat - no action needed

	case MsgTypeViewportSub:
		if len(message) >= 17 {
			c.viewport = DecodeViewport(message[1:])
		}

	case MsgTypeCellPlace:
		if len(message) >= 9 {
			x, y := DecodeCellPlace(message[1:])
			c.hub.SetCell(x, y, engine.Alive)
		}

	case MsgTypePlayerCursor:
		if len(message) >= 11 {
			_, x, y := DecodePlayerCursor(message[1:])
			c.hub.BroadcastPlayerCursor(c.playerID, x, y)
		}

	case MsgTypeClearWorld:
		c.hub.ClearWorld()

	case MsgTypeRandomize:
		c.hub.Randomize()

	case MsgTypeSetSpeed:
		if len(message) >= 5 {
			speed := DecodeSetSpeed(message[1:])
			c.hub.SetSpeed(speed)
		}
	}
}

// ServeWS handles websocket requests from peers
func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := NewClient(hub, conn)

	// Extract player info from query params if available
	client.playerID = r.URL.Query().Get("playerId")
	client.playerName = r.URL.Query().Get("playerName")
	if client.playerName == "" {
		client.playerName = generatePlayerName()
	}
	client.playerColor = generatePlayerColor()

	client.hub.register <- client

	// Allow collection of memory referenced by the caller
	go client.writePump()
	go client.readPump()
}

// Player name generation helpers
var adjectives = []string{
	"Cyber", "Neon", "Digital", "Quantum", "Neural",
	"Hyper", "Meta", "Nano", "Synth", "Void",
}

var nouns = []string{
	"Walker", "Runner", "Ghost", "Shadow", "Specter",
	"Entity", "Mind", "Soul", "Wave", "Pulse",
}

var colors = []string{
	"hsl(170, 80%, 60%)",
	"hsl(280, 80%, 60%)",
	"hsl(300, 80%, 60%)",
	"hsl(30, 80%, 60%)",
	"hsl(50, 80%, 60%)",
	"hsl(180, 80%, 60%)",
	"hsl(320, 80%, 60%)",
}

func generatePlayerName() string {
	adj := adjectives[time.Now().UnixNano()%int64(len(adjectives))]
	noun := nouns[time.Now().UnixNano()%int64(len(nouns))]
	return adj + "_" + noun
}

func generatePlayerColor() string {
	return colors[time.Now().UnixNano()%int64(len(colors))]
}
