package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

// ReporteJSON es el formato JSON para sync con la PWA.
type ReporteJSON struct {
	ReporteId  string  `json:"reporte_id"`
	ReporterId string  `json:"reporter_id"`
	Mensaje    string  `json:"mensaje"`
	TipoAlerta int32   `json:"tipo_alerta"`
	Lat        float32 `json:"lat"`
	Lng        float32 `json:"lng"`
	Timestamp  int64   `json:"timestamp"`
	TrustScore int     `json:"trust_score"`
}

// SyncRequest es el body del POST /sync.
type SyncRequest struct {
	Reportes []ReporteJSON `json:"reportes"`
	Desde    int64         `json:"desde"` // timestamp unix: dame lo que sea posterior a esto
}

// SyncResponse devuelve los reportes que el cliente no tiene.
type SyncResponse struct {
	Reportes []ReporteJSON `json:"reportes"`
}

func alertaToJSON(a AlertaDB) ReporteJSON {
	return ReporteJSON{
		ReporteId:  a.ReporteId,
		ReporterId: a.ReporterId,
		Mensaje:    a.Mensaje,
		TipoAlerta: a.TipoAlerta,
		Lat:        a.Lat,
		Lng:        a.Lng,
		Timestamp:  a.Timestamp,
		TrustScore: a.TrustScore,
	}
}

// POST /sync — sube reportes del cliente y devuelve los que le faltan.
func handleSync(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req SyncRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Guardar reportes nuevos (ignorar duplicados por reporte_id).
	for _, rj := range req.Reportes {
		if rj.ReporteId == "" {
			continue
		}
		alerta := AlertaDB{
			ReporteId:  rj.ReporteId,
			ReporterId: rj.ReporterId,
			Mensaje:    rj.Mensaje,
			TipoAlerta: rj.TipoAlerta,
			Lat:        rj.Lat,
			Lng:        rj.Lng,
			Timestamp:  rj.Timestamp,
		}
		result := DB.Where(AlertaDB{ReporteId: rj.ReporteId}).FirstOrCreate(&alerta)
		if result.RowsAffected > 0 {
			hub.BroadcastAlerta(alerta)
			go publicarEnResponseGrid(alerta)
		}
	}

	// Devolver los reportes posteriores al timestamp del cliente.
	var alertas []AlertaDB
	DB.Where("timestamp > ?", req.Desde).Find(&alertas)

	resp := SyncResponse{Reportes: make([]ReporteJSON, 0, len(alertas))}
	for _, a := range alertas {
		resp.Reportes = append(resp.Reportes, alertaToJSON(a))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GET /reportes?desde=<unix_timestamp> — para el dashboard.
func handleGetReportes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	desdeStr := r.URL.Query().Get("desde")
	var desde int64
	if desdeStr != "" {
		desde, _ = strconv.ParseInt(desdeStr, 10, 64)
	} else {
		// Por defecto las últimas 24 horas.
		desde = time.Now().Add(-24 * time.Hour).Unix()
	}

	var alertas []AlertaDB
	DB.Where("timestamp > ?", desde).Order("timestamp desc").Limit(500).Find(&alertas)

	result := make([]ReporteJSON, 0, len(alertas))
	for _, a := range alertas {
		result = append(result, alertaToJSON(a))
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// GET /ws — WebSocket para el dashboard en tiempo real.
func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	hub.Register(conn)
	defer func() {
		hub.Unregister(conn)
		conn.Close()
	}()
	// Mantener la conexión viva; el hub escribe, nosotros solo leemos pings.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
