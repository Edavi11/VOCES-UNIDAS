<script lang="ts">
  import { online, peerCount, pendientesSincronizar } from '../lib/store'
</script>

<div class="estado-bar">
  {#if $online}
    <span class="badge verde">🌐 Con señal</span>
  {:else if $peerCount > 0}
    <span class="badge amarillo">📡 Mesh · {$peerCount} vecino{$peerCount !== 1 ? 's' : ''}</span>
  {:else}
    <span class="badge rojo">📵 Sin señal</span>
  {/if}

  {#if $pendientesSincronizar > 0}
    <span class="badge gris">⏳ {$pendientesSincronizar} por sincronizar</span>
  {/if}
</div>

<style>
  .estado-bar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #111;
    flex-wrap: wrap;
  }
  .badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-weight: 600;
  }
  .verde  { background: #1e8449; color: #fff; }
  .amarillo { background: #d4ac0d; color: #000; }
  .rojo   { background: #c0392b; color: #fff; }
  .gris   { background: #444; color: #ddd; }
</style>
