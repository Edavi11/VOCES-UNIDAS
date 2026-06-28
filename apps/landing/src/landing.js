const RG_BASE = 'https://api.responsegrid.app'
const RG_EMERGENCY_ID = '11111111-1111-4111-8111-111111111111'
const SERVER_URL = ''

// ── QR de instalación ─────────────────────────────────────────
async function generarQR() {
  const url = window.location.origin + '/app/'
  try {
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
    const contenedor = document.getElementById('qr-instalacion')
    if (contenedor) contenedor.innerHTML = `<p style="color:#333;font-size:0.8rem;padding:1rem">${window.location.origin}/app/</p>`
  }
}

// ── Mapeo de prioridad ResponseGrid ──────────────────────────
const PRIORIDAD_LABEL = {
  urgent: { label: 'Urgente', color: '#e74c3c', emoji: '🔴' },
  high:   { label: 'Alto',    color: '#e67e22', emoji: '🟠' },
  medium: { label: 'Medio',   color: '#f1c40f', emoji: '🟡' },
  low:    { label: 'Bajo',    color: '#7f8c8d', emoji: '⚪' },
}

function formatTiempo(isoString) {
  if (!isoString) return ''
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return new Date(isoString).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

function escapeHTML(str) {
  if (!str) return ''
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// ── Dashboard ResponseGrid ────────────────────────────────────
async function cargarDashboard() {
  try {
    const [needsRes, emergencyRes] = await Promise.all([
      fetch(`${RG_BASE}/emergencies/${RG_EMERGENCY_ID}/public/needs?page=1&page_size=20`),
      fetch(`${RG_BASE}/emergencies/${RG_EMERGENCY_ID}`)
    ])

    const needs = needsRes.ok ? await needsRes.json() : []
    const emergency = emergencyRes.ok ? await emergencyRes.json() : null

    renderDashboard(Array.isArray(needs) ? needs : needs.data ?? [], emergency)
  } catch {
    // Fallback a nuestro servidor si ResponseGrid no responde
    cargarReportesLocales()
  }
}

function renderDashboard(needs, emergency) {
  // Contadores por prioridad
  const contadores = { urgent: 0, high: 0, medium: 0, low: 0 }
  needs.forEach(n => { if (n.priority in contadores) contadores[n.priority]++ })

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v }
  set('total-reportes', needs.length)
  set('total-salud',     contadores.urgent)
  set('total-alimentos', contadores.high)
  set('total-seguridad', contadores.medium)
  set('total-infra',     contadores.low)

  // Labels dinámicos para los stats
  const labelSalud     = document.getElementById('label-salud')
  const labelAlimentos = document.getElementById('label-alimentos')
  const labelSeguridad = document.getElementById('label-seguridad')
  const labelInfra     = document.getElementById('label-infra')
  if (labelSalud)     labelSalud.textContent     = '🔴 Urgente'
  if (labelAlimentos) labelAlimentos.textContent = '🟠 Alto'
  if (labelSeguridad) labelSeguridad.textContent = '🟡 Medio'
  if (labelInfra)     labelInfra.textContent     = '⚪ Bajo'

  const lista = document.getElementById('lista-reportes')
  if (!lista) return

  if (needs.length === 0) {
    lista.innerHTML = '<div class="cargando">No hay necesidades registradas aún. Sé el primero en reportar.</div>'
    return
  }

  lista.innerHTML = needs.slice(0, 20).map(n => {
    const p = PRIORIDAD_LABEL[n.priority] ?? PRIORIDAD_LABEL.low
    const ubicacion = n.location?.address ?? 'Venezuela'
    return `
      <div class="reporte-card" style="border-left-color: ${p.color}">
        <div class="tipo">${p.emoji} ${p.label} · ${escapeHTML(ubicacion)} · ${formatTiempo(n.createdAt)}</div>
        <div class="msg">${escapeHTML(n.title)}</div>
        ${n.description ? `<div class="meta">${escapeHTML(n.description)}</div>` : ''}
        ${n.location?.latitude ? `<div class="meta"><a href="https://maps.google.com?q=${n.location.latitude},${n.location.longitude}" target="_blank" rel="noopener" style="color:#3498db">📍 Ver en mapa</a></div>` : ''}
      </div>
    `
  }).join('')

  // Atribución requerida por CC BY-SA 4.0
  lista.innerHTML += `
    <p class="atribucion">
      Datos verificados por <a href="https://responsegrid.app" target="_blank" rel="noopener">ResponseGrid</a>
      · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>
    </p>
  `
}

// Fallback: nuestro propio servidor
async function cargarReportesLocales() {
  try {
    const res = await fetch(`${SERVER_URL}/reportes`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return

    const lista = document.getElementById('lista-reportes')
    if (!lista) return

    const TIPO_LABEL = { 0: 'Desconocido', 1: 'Salud', 2: 'Alimentos', 3: 'Seguridad', 4: 'Infraestructura' }
    const TIPO_EMOJI = { 0: '❓', 1: '🏥', 2: '🍞', 3: '🚨', 4: '🏗️' }
    const TIPO_COLOR = { 0: '#7f8c8d', 1: '#e74c3c', 2: '#f39c12', 3: '#e67e22', 4: '#3498db' }

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v }
    set('total-reportes', data.length)

    lista.innerHTML = data.slice(0, 20).map(r => `
      <div class="reporte-card" style="border-left-color: ${TIPO_COLOR[r.tipo_alerta] ?? '#555'}">
        <div class="tipo">${TIPO_EMOJI[r.tipo_alerta] ?? '❓'} ${TIPO_LABEL[r.tipo_alerta] ?? 'Desconocido'}</div>
        <div class="msg">${escapeHTML(r.mensaje)}</div>
      </div>
    `).join('')
  } catch {
    const lista = document.getElementById('lista-reportes')
    if (lista) lista.innerHTML = '<div class="cargando">Conectando con el servidor…</div>'
  }
}

// ── WebSocket para tiempo real ────────────────────────────────
function conectarWS() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${proto}://${location.host}/ws`)
  ws.onmessage = () => cargarDashboard()
  ws.onclose = () => setTimeout(conectarWS, 5000)
}

// ── Init ──────────────────────────────────────────────────────
generarQR()
cargarDashboard()
setInterval(cargarDashboard, 30_000)
if ('WebSocket' in window) conectarWS()
