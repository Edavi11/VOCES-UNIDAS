const DEVICE_ID_KEY = 'voces_device_id'

// Genera o recupera el ID único del dispositivo.
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// Genera un UUID v4 para cada reporte.
export function newReporteId(): string {
  return crypto.randomUUID()
}
