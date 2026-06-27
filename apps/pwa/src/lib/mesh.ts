import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { guardarReporte } from './db'
import type { Reporte } from './types'

const ROOM_PREFIX = 'voces-unidas-mesh-'

export interface MeshState {
  peers: number
  roomId: string
}

export class MeshNode {
  private ydoc: Y.Doc
  private provider: WebrtcProvider | null = null
  private reportes: Y.Array<Reporte>
  private roomId: string
  private onCambio: (reportes: Reporte[]) => void
  private onPeers: (n: number) => void

  constructor(
    roomId: string,
    onCambio: (reportes: Reporte[]) => void,
    onPeers: (n: number) => void,
  ) {
    this.roomId = roomId
    this.onCambio = onCambio
    this.onPeers = onPeers
    this.ydoc = new Y.Doc()
    this.reportes = this.ydoc.getArray<Reporte>('reportes')
  }

  conectar(maxPeers = 5): void {
    this.provider = new WebrtcProvider(
      ROOM_PREFIX + this.roomId,
      this.ydoc,
      {
        signaling: ['wss://signaling.yjs.dev'],
        maxConns: maxPeers,
      }
    )

    this.reportes.observe(async () => {
      const todos = this.reportes.toArray()
      // Persistir cada reporte nuevo en IndexedDB.
      for (const r of todos) {
        await guardarReporte({ ...r, sincronizado: false })
      }
      this.onCambio(todos)
    })

    this.provider.awareness.on('change', () => {
      const n = this.provider!.awareness.getStates().size - 1 // -1 = nosotros mismos
      this.onPeers(Math.max(0, n))
    })
  }

  // Propaga un reporte nuevo a todos los peers del mesh.
  publicarReporte(r: Reporte): void {
    // Evitar duplicados en el doc Yjs.
    const existe = this.reportes.toArray().some(x => x.reporte_id === r.reporte_id)
    if (!existe) {
      this.ydoc.transact(() => this.reportes.push([r]))
    }
  }

  getRoomId(): string {
    return this.roomId
  }

  desconectar(): void {
    this.provider?.destroy()
    this.ydoc.destroy()
  }
}

// Genera un room ID corto (6 caracteres) fácil de compartir.
export function generarRoomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
