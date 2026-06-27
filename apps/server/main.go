package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os"
)

//go:embed static/*
var staticFiles embed.FS

func main() {
	InitDB()
	go hub.Run()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// API
	http.HandleFunc("/sync", handleSync)
	http.HandleFunc("/reportes", handleGetReportes)
	http.HandleFunc("/ws", handleWS)

	// Archivos estáticos: dev = desde disco, prod = embebidos.
	if os.Getenv("DEV") == "1" {
		// /app/* → static/app/  (PWA Svelte)
		http.Handle("/app/", http.StripPrefix("/app/", http.FileServer(http.Dir("static/app"))))
		// /app   → redirige a /app/
		http.HandleFunc("/app", func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, "/app/", http.StatusFound)
		})
		// /      → static/ (Landing)
		http.Handle("/", http.FileServer(http.Dir("static")))
	} else {
		staticFS, err := fs.Sub(staticFiles, "static")
		if err != nil {
			panic(err)
		}
		appFS, err := fs.Sub(staticFiles, "static/app")
		if err != nil {
			panic(err)
		}
		http.Handle("/app/", http.StripPrefix("/app/", http.FileServer(http.FS(appFS))))
		http.HandleFunc("/app", func(w http.ResponseWriter, r *http.Request) {
			http.Redirect(w, r, "/app/", http.StatusFound)
		})
		http.Handle("/", http.FileServer(http.FS(staticFS)))
	}

	fmt.Printf("VOCES UNIDAS escuchando en :%s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Println("Error:", err)
	}
}
