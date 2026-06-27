package main

import (
	"fmt"
	"io"
	"net/http"
	"voceseunidas/pb"

	"google.golang.org/protobuf/proto"
)

func handleReporte(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "No se pudo leer el cuerpo", http.StatusBadRequest)
		return
	}

	reporte := &pb.Reporte{}
	err = proto.Unmarshal(body, reporte)
	if err != nil {
		http.Error(w, "Error al procesar el reporte", http.StatusBadRequest)
		return
	}

	nuevaAlerta := AlertaDB{
		ReporterId: reporte.ReporteroId,
		Mensaje:    reporte.Mensaje,
		TipoAlerta: int32(reporte.Tipo),
	}
	// Guardar en la base de datos
	DB.Create(&nuevaAlerta)
	fmt.Printf("Alerta recibida y guardada de %s: %s\n", reporte.ReporteroId, reporte.Mensaje)
	w.WriteHeader(http.StatusOK)
}

func main() {
	InitDB()
	http.HandleFunc("/sync", handleReporte)
	fmt.Println("Hub central escuchando en puerto 8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Printf("Error al iniciar el servidor: %s\n", err)
	}
}
