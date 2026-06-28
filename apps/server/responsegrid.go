package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

const (
	rgBaseURL     = "https://api.responsegrid.app"
	rgEmergencyID = "11111111-1111-4111-8111-111111111111"
)

type rgLocation struct {
	Address   string  `json:"address"`
	Latitude  float32 `json:"latitude"`
	Longitude float32 `json:"longitude"`
}

type rgSupplyLine struct {
	Name     string `json:"name"`
	Quantity int    `json:"quantity"`
	Category string `json:"category"`
}

type rgNeedPayload struct {
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Priority    string         `json:"priority"`
	Location    rgLocation     `json:"location"`
	Items       []rgSupplyLine `json:"items"`
}

// tipoToRG convierte nuestro TipoAlerta al schema de ResponseGrid
func tipoToRG(tipo int32) (priority string, category string) {
	switch tipo {
	case 1: // Salud
		return "urgent", "medical"
	case 2: // Alimentos
		return "high", "food"
	case 3: // Seguridad
		return "high", "general"
	case 4: // Infraestructura
		return "medium", "general"
	default:
		return "low", "general"
	}
}

func publicarEnResponseGrid(alerta AlertaDB) {
	token := os.Getenv("RESPONSEGRID_TOKEN")
	if token == "" {
		return
	}

	priority, category := tipoToRG(alerta.TipoAlerta)

	lat := alerta.Lat
	lng := alerta.Lng
	if lat == 0 && lng == 0 {
		// Coordenadas aproximadas del centro de Venezuela como fallback
		lat = 8.0
		lng = -66.0
	}

	payload := rgNeedPayload{
		Title:       alerta.Mensaje,
		Description: fmt.Sprintf("Reporte recibido via VOCES UNIDAS. ID: %s", alerta.ReporteId),
		Priority:    priority,
		Location: rgLocation{
			Address:   "Venezuela",
			Latitude:  lat,
			Longitude: lng,
		},
		Items: []rgSupplyLine{
			{Name: alerta.Mensaje, Quantity: 1, Category: category},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	url := fmt.Sprintf("%s/emergencies/%s/needs", rgBaseURL, rgEmergencyID)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("[ResponseGrid] Error al publicar: %v\n", err)
		return
	}
	defer resp.Body.Close()
	fmt.Printf("[ResponseGrid] Reporte publicado — status: %d\n", resp.StatusCode)
}
