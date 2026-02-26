package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/evo-sphere/server/internal/engine"
	"github.com/evo-sphere/server/internal/network"
)

func main() {
	// Initialize game engine
	universe := engine.NewUniverse()

	// Initialize with test patterns
	universe.InitializeWithPattern()

	// Initialize WebSocket hub
	hub := network.NewHub(universe)

	// Start hub in goroutine
	go hub.Run()

	// Setup HTTP server with CORS
	mux := http.NewServeMux()

	// WebSocket endpoint
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		network.ServeWS(hub, w, r)
	})

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","timestamp":"` + time.Now().Format(time.RFC3339) + `"}`))
	})

	// Stats endpoint
	mux.HandleFunc("/api/stats", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		stats := `{"generation":` + itoa(hub.GetGeneration()) +
			`,"population":` + itoa(hub.GetPopulation()) +
			`,"connected":` + itoa(uint32(hub.GetConnectedCount())) + `}`
		w.Write([]byte(stats))
	})

	// CORS middleware
	handler := corsMiddleware(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("╔════════════════════════════════════════════╗")
	log.Printf("║        EVO-SPHERE Server v1.0.0           ║")
	log.Printf("╠════════════════════════════════════════════╣")
	log.Printf("║  World Size: 1000x1000                     ║")
	log.Printf("║  Auto-reset: 300 generations               ║")
	log.Printf("║  Port: %s                                ║", port)
	log.Printf("╚════════════════════════════════════════════╝")
	log.Printf("")
	log.Printf("Server starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Simple itoa for uint32
func itoa(n uint32) string {
	if n == 0 {
		return "0"
	}
	var buf [32]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}
