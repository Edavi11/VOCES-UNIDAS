# VOCES UNIDAS — Handoff Técnico
**Hackathon "Build for Venezuela" · Última actualización: 27 Jun 2026**

---

## ¿Qué es esto?

Sistema de comunicación de emergencia diseñado para funcionar **sin internet ni señal celular**. Cada teléfono actúa como un nodo independiente que comparte alertas con dispositivos cercanos usando WiFi/WebRTC. Cuando un nodo recupera señal, sincroniza automáticamente toda la información acumulada al servidor central.

**Problema que resuelve:** Durante el terremoto en Venezuela, las torres celulares colapsaron dejando a miles incomunicados. Este sistema funciona aunque no haya infraestructura de red.

---

## URLs activas

| Entorno | URL |
|---------|-----|
| Landing page | https://voces-unidas-production.up.railway.app |
| PWA (app) | https://voces-unidas-production.up.railway.app/app/ |
| API — listar reportes | https://voces-unidas-production.up.railway.app/reportes |
| API — sync bidireccional | https://voces-unidas-production.up.railway.app/sync |
| WebSocket — dashboard | wss://voces-unidas-production.up.railway.app/ws |

---

## Repositorios

| Remote | URL | Uso |
|--------|-----|-----|
| `origin` | https://github.com/W1ndl0ve/VOCES-UNIDAS | Repo principal del equipo |
| `fork` | https://github.com/Edavi11/VOCES-UNIDAS | Fork conectado a Railway (deploy automático) |

**Rama de trabajo:** `erick`
**Railway escucha:** rama `main` del fork `Edavi11/VOCES-UNIDAS`

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO FINAL                            │
│                                                             │
│  Landing page  ──────────────→  Instala la PWA             │
│  (con internet)                 (Chrome → menú → instalar)  │
└───────────────────────────────────────┬─────────────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   PWA (Svelte)      │
                              │   En el teléfono    │
                              │                     │
                              │  ┌───────────────┐  │
                              │  │  IndexedDB    │  │
                              │  │  (local)      │  │
                              │  └───────────────┘  │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                   │                      │
            Sin señal              Con señal            Mesh P2P
                    │                   │                      │
            Guarda local          POST /sync           WebRTC+Yjs
                    │                   │              (entre peers)
                    │          ┌────────▼────────┐
                    │          │  Servidor Go    │
                    │          │  Railway        │
                    │          │                 │
                    │          │  SQLite /tmp    │
                    │          └─────────────────┘
                    │
            Cuando llega señal → sync automático
```

---

## Estructura del monorepo

```
VOCES-UNIDAS/
│
├── apps/
│   ├── server/                 # Backend Go
│   │   ├── main.go             # Entry point, rutas, embed de static/
│   │   ├── db.go               # Modelo AlertaDB + GORM + SQLite
│   │   ├── handlers.go         # POST /sync, GET /reportes, GET /ws
│   │   ├── hub.go              # WebSocket hub para dashboard tiempo real
│   │   ├── go.mod              # módulo: voceseunidas/server
│   │   ├── static/             # Archivos servidos por Go (gitignored excepto icons)
│   │   │   ├── index.html      # Landing page
│   │   │   ├── src/            # CSS + JS de la landing
│   │   │   └── app/            # Build de la PWA (generado por npm run build)
│   │   │       └── icons/      # Iconos PNG — SÍ están en git
│   │   └── proto/              # Schema protobuf (legado, no usado en API actual)
│   │
│   ├── pwa/                    # Frontend Svelte
│   │   ├── src/
│   │   │   ├── App.svelte      # Root: carga datos, sync auto, banner instalar
│   │   │   ├── components/
│   │   │   │   ├── FormReporte.svelte      # Crear alerta con GPS
│   │   │   │   ├── ListaReportes.svelte    # Lista de alertas offline
│   │   │   │   ├── QRConectar.svelte       # Mesh P2P via QR + WebRTC
│   │   │   │   ├── EstadoConexion.svelte   # Indicador sin señal/mesh/internet
│   │   │   │   └── InstalarApp.svelte      # Modal de instalación por navegador
│   │   │   └── lib/
│   │   │       ├── types.ts    # TipoAlerta, Reporte, colores, emojis
│   │   │       ├── db.ts       # IndexedDB (idb): guardar/leer reportes local
│   │   │       ├── sync.ts     # Sync bidireccional con servidor (auto cada 30s)
│   │   │       ├── mesh.ts     # Yjs + WebRTC: red P2P entre dispositivos
│   │   │       ├── crypto.ts   # UUID de dispositivo (localStorage)
│   │   │       └── store.ts    # Svelte stores: reportes, online, peers, vista
│   │   ├── public/icons/       # SVG + PNG fuente (192 y 512px)
│   │   ├── vite.config.ts      # base: /app/, PWA plugin, build → server/static/app
│   │   └── generate-icons.mjs  # Script: SVG → PNG con sharp
│   │
│   └── landing/                # Landing page estática
│       ├── index.html          # HTML completo (no usa framework)
│       └── src/
│           ├── landing.css     # Estilos (dark mode, responsive)
│           └── landing.js      # Dashboard tiempo real + QR de instalación
│
├── packages/
│   └── proto/
│       └── alerta.proto        # Schema compartido (legado)
│
├── nixpacks.toml               # Build Railway: npm build PWA → cp landing → go build
├── railway.json                # Config deploy Railway
└── package.json                # Monorepo scripts: dev:pwa, dev:server, build:all
```

---

## Stack tecnológico

| Capa | Tecnología | Versión | Motivo |
|------|-----------|---------|--------|
| Backend | Go | 1.26 | Alta concurrencia, binario único |
| ORM | GORM | 1.31 | Auto-migrate, abstracción DB |
| DB | SQLite (glebarez) | 1.11 | Sin CGO — funciona en Railway sin GCC |
| Frontend | Svelte | 5.x | Bundle mínimo, sin Virtual DOM |
| Build | Vite + vite-plugin-pwa | 5.x / 0.20 | PWA automática con Service Worker |
| Sync distribuido | Yjs | 13.x | CRDT — resolución de conflictos automática |
| P2P | y-webrtc | 10.x | WebRTC sin servidor de relay propio |
| DB local | idb | 8.x | Wrapper IndexedDB tipado |
| Deploy | Railway (Nixpacks) | — | Go + Node en un solo build |
| QR | qrcode + jsQR | — | Generar y escanear QR sin dependencias nativas |

---

## API del servidor

### `POST /sync`
Sube reportes del cliente y devuelve los que el cliente no tiene.

```json
// Request
{
  "reportes": [
    {
      "reporte_id": "uuid-v4",
      "reporter_id": "uuid-dispositivo",
      "mensaje": "Hay personas atrapadas en el edificio",
      "tipo_alerta": 1,
      "lat": 10.4806,
      "lng": -66.9036,
      "timestamp": 1720000000,
      "trust_score": 1
    }
  ],
  "desde": 1719990000
}

// Response
{
  "reportes": [ /* reportes que el cliente no tiene */ ]
}
```

### `GET /reportes?desde=<unix_timestamp>`
Devuelve reportes posteriores al timestamp. Por defecto últimas 24h.

### `GET /ws`
WebSocket. El servidor hace push de cada reporte nuevo al dashboard.

---

## Tipos de alerta

| Código | Nombre | Emoji | Color |
|--------|--------|-------|-------|
| 0 | Desconocido | ❓ | #7f8c8d |
| 1 | Salud | 🏥 | #e74c3c |
| 2 | Alimentos | 🍞 | #f39c12 |
| 3 | Seguridad | 🚨 | #e67e22 |
| 4 | Infraestructura | 🏗️ | #3498db |

---

## Flujo offline-first

```
1. Usuario abre la PWA (funciona sin internet por Service Worker)
2. Crea un reporte → se guarda en IndexedDB inmediatamente
3. En background:
   a. Si hay peers WebRTC → propaga el reporte via Yjs (mesh local)
   b. Si hay internet → POST /sync al servidor central
4. Cuando llega señal (evento 'online') → sync automático cada 30s
5. El servidor deduplica por reporte_id (UUID generado en el dispositivo)
```

---

## Mesh P2P — cómo funciona

```
[Teléfono A] genera QR con room ID
[Teléfono B] escanea el QR
     ↓
WebRTC handshake directo (sin pasar por servidor)
     ↓
Yjs sincroniza todos los reportes automáticamente
     ↓
A se puede ir → datos quedan en B
B se conecta a C → C recibe datos de A y B
```

Cada nodo soporta hasta 5 conexiones simultáneas (configurable). La red crece por saltos — A→B→C→...→Z sin límite de nodos.

---

## Cómo levantar en local

### Requisitos
- Go 1.22+
- Node 20+
- npm 10+

### Servidor Go
```powershell
cd apps/server
go mod tidy
$env:DEV="1"; go run .
# Servidor en http://localhost:8080
```

### PWA (desarrollo)
```powershell
cd apps/pwa
npm install
npm run dev
# PWA en http://localhost:5174
```

### Build completo (producción)
```powershell
# Desde la raíz del repo
npm run build:pwa    # Compila Svelte → apps/server/static/app/
# Luego reiniciar el servidor Go sin DEV=1
cd apps/server
go run .
# Todo en http://localhost:8080
```

---

## Deploy en Railway

Railway detecta cambios en la rama `main` del fork `Edavi11/VOCES-UNIDAS` y redeploya automáticamente usando `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["go", "nodejs_20"]

[phases.build]
cmds = [
  "cd apps/pwa && npm install && npm run build",
  "cp -r apps/landing/. apps/server/static/",
  "cd apps/server && go build -o ../../dist/server ."
]

[start]
cmd = "./dist/server"
```

**Variables de entorno en Railway:**
- `PORT` → Railway lo inyecta automáticamente
- `DB_PATH` → por defecto `/tmp/voces_unidas.db` (se borra al redeploy — aceptable para hackathon)

---

## Flujo para subir cambios

```powershell
# 1. Hacer cambios en el código

# 2. Si modificaste la PWA → recompilar
cd apps/pwa && npm run build && cd ../..

# 3. Commit
git add <archivos>
git commit -m "descripción"

# 4. Push a AMBOS remotes
git push origin erick        # Repo del equipo
git push fork erick:main     # Railway redeploya automáticamente
```

---

## Estado actual — qué está listo y qué falta

### ✅ Completado
- [x] Monorepo estructurado (server / pwa / landing)
- [x] Servidor Go con API JSON, sync bidireccional, WebSocket
- [x] Base de datos SQLite con deduplicación por UUID
- [x] PWA Svelte funcional — crear alertas, ver lista, estado offline
- [x] IndexedDB local — funciona 100% sin internet
- [x] Sync automático con servidor cuando hay señal
- [x] Mesh P2P con Yjs + WebRTC + QR para conectar dispositivos sin internet
- [x] Landing page completa — problema, solución, guía hotspot, dashboard
- [x] Dashboard en tiempo real via WebSocket
- [x] Service Worker — app instalable y funciona offline
- [x] Deploy en Railway con HTTPS
- [x] Iconos PWA (192px y 512px)
- [x] Manifest corregido para PWABuilder

### 🔄 En progreso
- [ ] APK via PWABuilder / TWA — manifest en proceso de validación (score 14/45 → necesita subir)
- [ ] Distribuir APK desde la landing para instalación nativa directa

### ❌ Pendiente
- [ ] Proof of Presence (firmas digitales por dispositivo)
- [ ] Trust Score visible en dashboard
- [ ] Mapa de alertas con Leaflet
- [ ] Migrar DB a Postgres para persistencia real entre deploys
- [ ] Screenshots en el manifest para Play Store
- [ ] iOS — instrucciones específicas para Safari
- [ ] Modo bajo consumo de batería para el mesh

---

## Decisiones técnicas importantes

**¿Por qué SQLite y no Postgres?**
Para el hackathon, SQLite en `/tmp` es suficiente. No requiere servicio adicional en Railway. La migración a Postgres es trivial con GORM — solo cambiar el driver.

**¿Por qué glebarez/sqlite y no mattn/go-sqlite3?**
`mattn/go-sqlite3` requiere CGO (compilador C). En Windows y en Railway sin GCC configurado, falla. `glebarez/sqlite` es puro Go.

**¿Por qué Yjs y no un protocolo custom?**
Yjs implementa CRDTs (Conflict-free Replicated Data Types) — resolución automática de conflictos cuando dos nodos editan el mismo dato offline. Reinventarlo sería semanas de trabajo.

**¿Por qué la PWA no se instala automáticamente?**
Chrome requiere que el usuario haya interactuado con la página por 30 segundos Y haya hecho al menos 1 clic antes de disparar `beforeinstallprompt`. Es una política de seguridad del navegador que no se puede evadir con código. Solución en progreso: APK via TWA.

**¿Por qué dos remotes de git?**
El repo principal es `W1ndl0ve/VOCES-UNIDAS`. Railway está conectado al fork `Edavi11/VOCES-UNIDAS` porque Railway necesita permisos de instalación de GitHub App en el repo, y solo `Edavi11` tiene control del fork.
