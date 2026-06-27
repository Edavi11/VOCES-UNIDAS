const SERVER_URL = ''  // mismo origen cuando está embebido en el Go server

const TIPO_LABEL = { 0: 'Desconocido', 1: 'Salud', 2: 'Alimentos', 3: 'Seguridad', 4: 'Infraestructura' }
const TIPO_EMOJI = { 0: '❓', 1: '🏥', 2: '🍞', 3: '🚨', 4: '🏗️' }
const TIPO_COLOR = { 0: '#7f8c8d', 1: '#e74c3c', 2: '#f39c12', 3: '#e67e22', 4: '#3498db' }

// ── QR de instalación ─────────────────────────────────────────
async function generarQR() {
  const url = window.location.origin + '/app'
  try {
    // Usa la API QR pública de Google Charts (solo disponible con internet)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000`
    const img = document.createElement('img')
    img.src = qrUrl
    img.alt = 'QR para instalar VOCES UNIDAS'
    img.width = 200
    const contenedor = document.getElementById('qr-instalacion')
    if (contenedor) {
      contenedor.innerHTML = ''
      contenedor.appendChild(img)
    }
  } catch {
    // Sin internet, mostrar URL textual
    const contenedor = document.getElementById('qr-instalacion')
    if (contenedor) contenedor.innerHTML = `<p style="color:#333;font-size:0.8rem;padding:1rem">${window.location.origin}/app</p>`
  }
}

// ── Dashboard en tiempo real ──────────────────────────────────
function formatTiempo(ts) {
  const diff = Math.floor((Date.now() - ts * 1000) / 1000)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  return `Hace ${Math.floor(diff / 3600)} h`
}

function renderReportes(reportes) {
  const lista = document.getElementById('lista-reportes')
  if (!lista) return

  // Contadores
  const contadores = { total: reportes.length, 1: 0, 2: 0, 3: 0, 4: 0 }
  reportes.forEach(r => { if (r.tipo_alerta in contadores) contadores[r.tipo_alerta]++ })

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v }
  set('total-reportes', contadores.total)
  set('total-salud', contadores[1])
  set('total-alimentos', contadores[2])
  set('total-seguridad', contadores[3])
  set('total-infra', contadores[4])

  if (reportes.length === 0) {
    lista.innerHTML = '<div class="cargando">No hay alertas recientes.</div>'
    return
  }

  lista.innerHTML = reportes.slice(0, 20).map(r => `
    <div class="reporte-card" style="border-left-color: ${TIPO_COLOR[r.tipo_alerta] ?? '#555'}">
      <div class="tipo">${TIPO_EMOJI[r.tipo_alerta] ?? '❓'} ${TIPO_LABEL[r.tipo_alerta] ?? 'Desconocido'} · ${formatTiempo(r.timestamp)}</div>
      <div class="msg">${escapeHTML(r.mensaje)}</div>
      <div class="meta">
        Confiabilidad: ${trustLabel(r.trust_score)}
        ${r.lat && r.lng ? ` · <a href="https://maps.google.com?q=${r.lat},${r.lng}" target="_blank" rel="noopener" style="color:#3498db">📍 Ver en mapa</a>` : ''}
      </div>
    </div>
  `).join('')
}

function trustLabel(score) {
  if (score >= 10) return '🔴 Confirmado'
  if (score >= 3)  return '🟡 Probable'
  return '⚪ No verificado'
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

async function cargarReportes() {
  try {
    const res = await fetch(`${SERVER_URL}/reportes`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    renderReportes(Array.isArray(data) ? data : [])
  } catch {
    const lista = document.getElementById('lista-reportes')
    if (lista) lista.innerHTML = '<div class="cargando">No se pudo conectar al servidor. Los reportes aparecerán aquí cuando haya señal.</div>'
  }
}

// ── WebSocket para tiempo real ────────────────────────────────
function conectarWS() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/ws`)
  ws.onmessage = () => cargarReportes()
  ws.onclose = () => setTimeout(conectarWS, 5000)
}

// ── Init ──────────────────────────────────────────────────────
generarQR()
cargarReportes()
setInterval(cargarReportes, 30_000)

if ('WebSocket' in window) {
  conectarWS()
}
