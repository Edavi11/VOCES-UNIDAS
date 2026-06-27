<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { TIPO_LABEL, TIPO_EMOJI, type TipoAlerta, type Reporte } from '../lib/types'
  import { guardarReporte } from '../lib/db'
  import { getDeviceId, newReporteId } from '../lib/crypto'
  import { reportes, vista } from '../lib/store'

  const dispatch = createEventDispatcher<{ nuevo: Reporte }>()

  let mensaje = ''
  let tipo: TipoAlerta = 1
  let obtenendoUbicacion = false
  let enviando = false
  let error = ''

  const tipos = ([1, 2, 3, 4] as TipoAlerta[])

  async function obtenerUbicacion(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0 })
        return
      }
      obtenendoUbicacion = true
      navigator.geolocation.getCurrentPosition(
        pos => {
          obtenendoUbicacion = false
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          obtenendoUbicacion = false
          resolve({ lat: 0, lng: 0 })
        },
        { timeout: 5000 }
      )
    })
  }

  async function enviar() {
    if (!mensaje.trim()) {
      error = 'Escribe una descripción del problema.'
      return
    }
    error = ''
    enviando = true

    const { lat, lng } = await obtenerUbicacion()

    const reporte: Reporte = {
      reporte_id: newReporteId(),
      reporter_id: getDeviceId(),
      mensaje: mensaje.trim(),
      tipo_alerta: tipo,
      lat,
      lng,
      timestamp: Math.floor(Date.now() / 1000),
      trust_score: 1,
      sincronizado: false,
    }

    await guardarReporte(reporte)
    reportes.update(lista => [reporte, ...lista])
    dispatch('nuevo', reporte)

    mensaje = ''
    enviando = false
    vista.set('lista')
  }
</script>

<div class="form-container">
  <h2>Nueva alerta</h2>

  <div class="tipos">
    {#each tipos as t}
      <button
        class="tipo-btn"
        class:activo={tipo === t}
        on:click={() => tipo = t}
        type="button"
      >
        {TIPO_EMOJI[t]} {TIPO_LABEL[t]}
      </button>
    {/each}
  </div>

  <textarea
    bind:value={mensaje}
    placeholder="Describe la situación con la mayor claridad posible. ¿Qué pasa? ¿Dónde exactamente? ¿Cuántas personas?"
    rows="5"
  />

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <p class="ubicacion-nota">
    📍 {obtenendoUbicacion ? 'Obteniendo ubicación…' : 'Se incluirá tu ubicación automáticamente'}
  </p>

  <div class="acciones">
    <button class="btn-secundario" on:click={() => vista.set('lista')}>Cancelar</button>
    <button class="btn-primario" on:click={enviar} disabled={enviando}>
      {enviando ? 'Enviando…' : '🔴 Enviar alerta'}
    </button>
  </div>
</div>

<style>
  .form-container {
    padding: 1.5rem;
    max-width: 500px;
    margin: 0 auto;
  }
  h2 { color: #e74c3c; margin-bottom: 1rem; }
  .tipos {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .tipo-btn {
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    border: 2px solid #444;
    background: #222;
    color: #ccc;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }
  .tipo-btn.activo {
    border-color: #e74c3c;
    background: #4a0a0a;
    color: #fff;
  }
  textarea {
    width: 100%;
    padding: 0.75rem;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 8px;
    color: #fff;
    font-size: 1rem;
    resize: vertical;
    box-sizing: border-box;
  }
  .ubicacion-nota { color: #888; font-size: 0.85rem; margin: 0.5rem 0; }
  .error { color: #e74c3c; font-size: 0.85rem; }
  .acciones { display: flex; gap: 0.75rem; margin-top: 1rem; }
  .btn-primario {
    flex: 1;
    padding: 0.75rem;
    background: #c0392b;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-primario:disabled { opacity: 0.6; }
  .btn-secundario {
    padding: 0.75rem 1.25rem;
    background: #333;
    color: #ccc;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
