package main

import (
	"bytes"
	"log"
	"net/http"
	"voceseunidas/pb"

	"google.golang.org/protobuf/proto"
)

func main() {
	reporte := &pb.Reporte{
		Id:          "test-123",
		Tipo:        pb.TipoAlerta_SALUD,
		Mensaje:     "Necesito asistencia médica urgente",
		ReporteroId: "dispositivo-001",
	}
	data, _ := proto.Marshal(reporte)

	resp, err := http.Post("http://localhost:8080/sync", "application/octet-stream", bytes.NewBuffer(data))
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Respuesta del servidor: %s", resp.Status)
}
