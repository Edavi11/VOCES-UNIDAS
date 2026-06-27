<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import QRCode from 'qrcode'
  import jsQR from 'jsqr'
  import { MeshNode, generarRoomId } from '../lib/mesh'
  import { reportes, peerCount, roomId, vista } from '../lib/store'
  import { obtenerReportes } from '../lib/db'
  import type { Reporte } from '../lib/types'

  let modo: 'mostrar' | 'escanear' = 'mostrar'
  let canvas: HTMLCanvasElement
  let videoEl: HTMLVideoElement
  let qrDataUrl = ''
  let meshNode: MeshNode | null = null
  let stream: MediaStream | null = null
  let escaneando = false
  let error = ''
  let maxPeers = 5

  const miRoomId = generarRoomId()

  async function iniciarMesh(id: string) {
    const reportesLocales = await obtenerReportes()

    meshNode = new MeshNode(
      id,
      (nuevos: Reporte[]) => reportes.set(nuevos),
      (n: number) => peerCount.set(n),
    )
    meshNode.conectar(maxPeers)
    roomId.set(id)

    // Publicar reportes locales en el mesh para que otros los reciban.
    for (const r of reportesLocales) {
      meshNode.publicarReporte(r)
    }
  }

  onMount(async () => {
    // Generar QR con el room ID.
    const payload = JSON.stringify({ v: 1, room: miRoomId })
    qrDataUrl = await QRCode.toDataURL(payload, {
      width: 260,
      margin: 2,
      color: { dark: '#ffffff', light: '#1a1a1a' },
    })
    await iniciarMesh(miRoomId)
  })

  onDestroy(() => {
    meshNode?.desconectar()
    stream?.getTracks().forEach(t => t.stop())
  })

  async function iniciarEscaneo() {
    modo = 'escanear'
    error = ''
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      videoEl.srcObject = stream
      videoEl.play()
      escaneando = true
      escanearFrame()
    } catch {
      error = 'No se pudo acceder a la cámara.'
    }
  }

  function escanearFrame() {
    if (!escaneando || !videoEl || videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
      if (escaneando) requestAnimationFrame(escanearFrame)
      return
    }
    const ctx = canvas.getContext('2d')!
    canvas.width = videoEl.videoWidth
    canvas.height = videoEl.videoHeight
    ctx.drawImage(videoEl, 0, 0)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height)
    if (code) {
      try {
        const payload = JSON.parse(code.data) as { v: number; room: string }
        if (payload.v === 1 && payload.room) {
          escaneando = false
          stream?.getTracks().forEach(t => t.stop())
          meshNode?.desconectar()
          iniciarMesh(payload.room)
          modo = 'mostrar'
        }
      } catch {
        // QR no válido — seguir escaneando
      }
    }
    if (escaneando) requestAnimationFrame(escanearFrame)
  }
</script>

<div class="conectar-container">
  <h2>Conectar con personas cercanas</h2>
  <p class="sub">Sin internet, solo WiFi o Bluetooth.</p>

  <div class="tabs">
    <button class:activo={modo === 'mostrar'} on:click={() => modo = 'mostrar'}>
      Mostrar mi QR
    </button>
    <button class:activo={modo === 'escanear'} on:click={iniciarEscaneo}>
      Escanear QR
    </button>
  </div>

  {#if modo === 'mostrar'}
    <div class="qr-section">
      <p class="instruccion">Muestra este código a las personas cercanas para que se conecten contigo y reciban todas las alertas automáticamente.</p>
      {#if qrDataUrl}
        <img src={qrDataUrl} alt="Código QR para unirse" class="qr-img" />
      {/if}
      <p class="room-code">Código manual: <strong>{miRoomId}</strong></p>

      <div class="peers-info">
        {#if $peerCount === 0}
          <p class="esperando">⏳ Esperando que alguien escanee…</p>
        {:else}
          <p class="conectado">✅ {$peerCount} persona{$peerCount !== 1 ? 's' : ''} conectada{$peerCount !== 1 ? 's' : ''}</p>
        {/if}
      </div>

      <div class="max-peers">
        <label>Máximo de conexiones simultáneas:
          <select bind:value={maxPeers}>
            <option value={3}>3 (bajo consumo de batería)</option>
            <option value={5}>5 (recomendado)</option>
            <option value={8}>8 (zona densa)</option>
            <option value={15}>15 (nodo coordinador)</option>
          </select>
        </label>
      </div>
    </div>
  {:else}
    <div class="scan-section">
      <p class="instruccion">Apunta la cámara al QR de otra persona para conectarte y compartir alertas automáticamente.</p>
      {#if error}
        <p class="error">{error}</p>
      {:else}
        <video bind:this={videoEl} playsinline muted class="video-preview"></video>
        <canvas bind:this={canvas} style="display:none"></canvas>
      {/if}
    </div>
  {/if}

  <button class="btn-volver" on:click={() => vista.set('lista')}>← Volver</button>
</div>

<style>
  .conectar-container { padding: 1.5rem; max-width: 420px; margin: 0 auto; }
  h2 { color: #e74c3c; margin-bottom: 0.25rem; }
  .sub { color: #888; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  .tabs button {
    flex: 1; padding: 0.6rem;
    background: #222; border: 2px solid #444;
    color: #aaa; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
  }
  .tabs button.activo { border-color: #e74c3c; color: #fff; background: #4a0a0a; }
  .instruccion { color: #bbb; font-size: 0.9rem; margin-bottom: 1rem; }
  .qr-img { display: block; margin: 0 auto 1rem; border-radius: 12px; }
  .room-code { text-align: center; color: #888; font-size: 0.85rem; margin-bottom: 1rem; }
  .room-code strong { color: #fff; letter-spacing: 0.15em; }
  .esperando { color: #888; text-align: center; }
  .conectado { color: #2ecc71; text-align: center; font-weight: 700; }
  .max-peers { margin-top: 1rem; }
  .max-peers label { color: #888; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.25rem; }
  .max-peers select { background: #222; color: #fff; border: 1px solid #444; border-radius: 6px; padding: 0.4rem; }
  .video-preview { width: 100%; border-radius: 12px; background: #000; }
  .error { color: #e74c3c; }
  .btn-volver {
    margin-top: 1.5rem; width: 100%; padding: 0.75rem;
    background: #222; color: #aaa; border: 1px solid #444;
    border-radius: 8px; cursor: pointer;
  }
  .peers-info { margin-bottom: 0.5rem; }
</style>
