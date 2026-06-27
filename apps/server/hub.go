package main

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub mantiene todas las conexiones WebSocket activas del dashboard.
type Hub struct {
	clients   map[*websocket.Conn]bool
	broadcast chan []byte
	mu        sync.Mutex
}

var hub = &Hub{
	clients:   make(map[*websocket.Conn]bool),
	broadcast: make(chan []byte, 256),
}

func (h *Hub) Run() {
	for msg := range h.broadcast {
		h.mu.Lock()
		for conn := range h.clients {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				conn.Close()
				delete(h.clients, conn)
			}
		}
		h.mu.Unlock()
	}
}

func (h *Hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()
}

func (h *Hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
}

func (h *Hub) BroadcastAlerta(a AlertaDB) {
	data, err := json.Marshal(alertaToJSON(a))
	if err != nil {
		return
	}
	select {
	case h.broadcast <- data:
	default:
	}
}
