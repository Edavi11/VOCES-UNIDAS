package main

import (
	"fmt"
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

type AlertaDB struct {
	gorm.Model
	ReporteId  string  `gorm:"uniqueIndex"` // UUID generado en el dispositivo
	ReporterId string
	Mensaje    string
	TipoAlerta int32
	Lat        float32
	Lng        float32
	Timestamp  int64
	TrustScore int     `gorm:"default:1"`
}

var DB *gorm.DB

func InitDB() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "voces_unidas.db"
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	// sqlite aquí es github.com/glebarez/sqlite — no requiere CGO en Windows
	if err != nil {
		panic("No se pudo conectar a la base de datos: " + err.Error())
	}

	err = DB.AutoMigrate(&AlertaDB{})
	if err != nil {
		fmt.Println("Error al migrar:", err)
	} else {
		fmt.Println("Base de datos lista.")
	}
}
