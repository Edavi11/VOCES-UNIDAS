import { writable, derived } from 'svelte/store'
import type { Reporte } from './types'

export const reportes = writable<Reporte[]>([])
export const online = writable(navigator.onLine)
export const peerCount = writable(0)
export const roomId = writable<string | null>(null)
export const vista = writable<'lista' | 'crear' | 'mapa' | 'conectar'>('lista')

export const totalReportes = derived(reportes, $r => $r.length)
export const pendientesSincronizar = derived(
  reportes,
  $r => $r.filter(r => !r.sincronizado).length
)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => online.set(true))
  window.addEventListener('offline', () => online.set(false))
}
