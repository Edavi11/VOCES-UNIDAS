import { openDB, type IDBPDatabase } from 'idb'
import type { Reporte } from './types'

const DB_NAME = 'voces-unidas'
const DB_VERSION = 1
const STORE = 'reportes'

let _db: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'reporte_id' })
      store.createIndex('timestamp', 'timestamp')
      store.createIndex('sincronizado', 'sincronizado')
    },
  })
  return _db
}

export async function guardarReporte(r: Reporte): Promise<void> {
  const db = await getDB()
  await db.put(STORE, r)
}

export async function guardarReportes(reportes: Reporte[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE, 'readwrite')
  await Promise.all([
    ...reportes.map(r => tx.store.put(r)),
    tx.done,
  ])
}

export async function obtenerReportes(): Promise<Reporte[]> {
  const db = await getDB()
  const todos = await db.getAllFromIndex(STORE, 'timestamp')
  return todos.reverse() as Reporte[]
}

export async function obtenerNosincronizados(): Promise<Reporte[]> {
  const db = await getDB()
  return (await db.getAllFromIndex(STORE, 'sincronizado', false)) as Reporte[]
}

export async function marcarSincronizado(reporte_id: string): Promise<void> {
  const db = await getDB()
  const r = await db.get(STORE, reporte_id) as Reporte | undefined
  if (r) {
    r.sincronizado = true
    await db.put(STORE, r)
  }
}

export async function ultimoTimestamp(): Promise<number> {
  const db = await getDB()
  const cursor = await db.transaction(STORE).store.index('timestamp').openCursor(null, 'prev')
  return (cursor?.value as Reporte | undefined)?.timestamp ?? 0
}
