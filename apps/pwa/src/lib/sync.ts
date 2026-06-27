import {
  obtenerNosincronizados,
  guardarReportes,
  marcarSincronizado,
  ultimoTimestamp,
} from './db'
import type { Reporte } from './types'

// Usa el mismo origen desde donde se cargó la app.
// Si la PWA se abre desde http://192.168.1.159:8080/app/, apunta a http://192.168.1.159:8080
const SERVER_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (import.meta.env.VITE_SERVER_URL ?? '')

let syncEnCurso = false

export async function sincronizarConServidor(): Promise<void> {
  if (syncEnCurso || !navigator.onLine) return
  syncEnCurso = true

  try {
    const pendientes = await obtenerNosincronizados()
    const desde = await ultimoTimestamp()

    const res = await fetch(`${SERVER_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportes: pendientes, desde }),
    })

    if (!res.ok) return

    const data = await res.json() as { reportes: Reporte[] }

    // Guardar los que el servidor nos mandó.
    if (data.reportes?.length) {
      const marcados = data.reportes.map(r => ({ ...r, sincronizado: true }))
      await guardarReportes(marcados)
    }

    // Marcar como sincronizados los que subimos.
    for (const r of pendientes) {
      await marcarSincronizado(r.reporte_id)
    }
  } catch {
    // Sin conexión o error de red — se reintentará en el próximo ciclo.
  } finally {
    syncEnCurso = false
  }
}

// Inicia el ciclo de sync automático (cada 30 s si hay señal).
export function iniciarSyncAuto(onActualizacion: () => void): () => void {
  const handler = async () => {
    await sincronizarConServidor()
    onActualizacion()
  }

  window.addEventListener('online', handler)
  const intervalo = setInterval(handler, 30_000)

  // Primer intento inmediato.
  handler()

  return () => {
    window.removeEventListener('online', handler)
    clearInterval(intervalo)
  }
}
