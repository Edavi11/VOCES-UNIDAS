<script lang="ts">
  import { reportes } from '../lib/store'
  import { TIPO_LABEL, TIPO_EMOJI, TIPO_COLOR, type TipoAlerta } from '../lib/types'

  function formatearTiempo(ts: number): string {
    const d = new Date(ts * 1000)
    const ahora = Date.now()
    const diff = Math.floor((ahora - d.getTime()) / 1000)
    if (diff < 60) return 'Hace un momento'
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
  }

  function trustLabel(score: number): string {
    if (score >= 10) return '🔴 Confirmado'
    if (score >= 3)  return '🟡 Probable'
    return '⚪ No verificado'
  }
</script>

<div class="lista">
  {#if $reportes.length === 0}
    <div class="vacio">
      <p>No hay alertas todavía.</p>
      <p class="sub">Cuando alguien reporte una emergencia cercana, aparecerá aquí — aunque no tengas internet.</p>
    </div>
  {:else}
    {#each $reportes as r (r.reporte_id)}
      <div class="tarjeta" style="border-left: 4px solid {TIPO_COLOR[r.tipo_alerta as TipoAlerta]}">
        <div class="cabecera">
          <span class="tipo">{TIPO_EMOJI[r.tipo_alerta as TipoAlerta]} {TIPO_LABEL[r.tipo_alerta as TipoAlerta]}</span>
          <span class="tiempo">{formatearTiempo(r.timestamp)}</span>
        </div>
        <p class="mensaje">{r.mensaje}</p>
        <div class="pie">
          <span class="trust">{trustLabel(r.trust_score)}</span>
          {#if !r.sincronizado}
            <span class="pendiente">⏳ Pendiente de sync</span>
          {/if}
          {#if r.lat && r.lng}
            <a
              class="mapa-link"
              href="https://maps.google.com?q={r.lat},{r.lng}"
              target="_blank"
              rel="noopener"
            >📍 Ver en mapa</a>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .lista { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .vacio {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
  }
  .vacio .sub { font-size: 0.85rem; margin-top: 0.5rem; }
  .tarjeta {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 1rem;
  }
  .cabecera {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .tipo { font-weight: 700; font-size: 0.9rem; color: #eee; }
  .tiempo { font-size: 0.75rem; color: #666; }
  .mensaje { color: #ddd; line-height: 1.5; margin: 0 0 0.75rem; }
  .pie {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    color: #888;
  }
  .pendiente { color: #d4ac0d; }
  .mapa-link { color: #3498db; text-decoration: none; }
</style>
