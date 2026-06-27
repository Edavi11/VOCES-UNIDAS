export type TipoAlerta = 0 | 1 | 2 | 3 | 4

export const TIPO_LABEL: Record<TipoAlerta, string> = {
  0: 'Desconocido',
  1: 'Salud',
  2: 'Alimentos',
  3: 'Seguridad',
  4: 'Infraestructura',
}

export const TIPO_EMOJI: Record<TipoAlerta, string> = {
  0: '❓',
  1: '🏥',
  2: '🍞',
  3: '🚨',
  4: '🏗️',
}

export const TIPO_COLOR: Record<TipoAlerta, string> = {
  0: '#7f8c8d',
  1: '#e74c3c',
  2: '#f39c12',
  3: '#e67e22',
  4: '#3498db',
}

export interface Reporte {
  reporte_id: string
  reporter_id: string
  mensaje: string
  tipo_alerta: TipoAlerta
  lat: number
  lng: number
  timestamp: number
  trust_score: number
  // Solo local, no se sube al servidor
  sincronizado?: boolean
}
