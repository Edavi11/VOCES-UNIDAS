<script lang="ts">
  export let onCerrar: () => void

  // Detectar el navegador/OS para mostrar instrucciones específicas
  const ua = navigator.userAgent
  const esIOS = /iphone|ipad|ipod/i.test(ua)
  const esSamsung = /samsungbrowser/i.test(ua)
  const esFirefox = /firefox/i.test(ua)
  const esChrome = !esSamsung && /chrome/i.test(ua)
</script>

<div class="modal-overlay" on:click={onCerrar}>
  <div class="modal" on:click|stopPropagation>
    <button class="cerrar" on:click={onCerrar}>✕</button>
    <h2>📲 Instalar VOCES UNIDAS</h2>
    <p class="sub">Sigue estos pasos según tu navegador:</p>

    {#if esIOS}
      <div class="pasos">
        <div class="paso">
          <span class="num">1</span>
          <p>Toca el botón de compartir <strong>⎙</strong> en la barra inferior de Safari</p>
        </div>
        <div class="paso">
          <span class="num">2</span>
          <p>Desplázate y toca <strong>"Añadir a pantalla de inicio"</strong></p>
        </div>
        <div class="paso">
          <span class="num">3</span>
          <p>Toca <strong>"Añadir"</strong> — ¡listo!</p>
        </div>
      </div>

    {:else if esSamsung}
      <div class="pasos">
        <div class="paso">
          <span class="num">1</span>
          <p>Toca el icono de <strong>menú</strong> (⋮) arriba a la derecha</p>
        </div>
        <div class="paso">
          <span class="num">2</span>
          <p>Toca <strong>"Añadir página a"</strong> → <strong>"Pantalla de inicio"</strong></p>
        </div>
        <div class="paso">
          <span class="num">3</span>
          <p>Toca <strong>"Añadir"</strong> — ¡listo!</p>
        </div>
      </div>

    {:else if esFirefox}
      <div class="pasos">
        <div class="paso">
          <span class="num">1</span>
          <p>Toca el icono de <strong>menú</strong> (⋮) arriba a la derecha</p>
        </div>
        <div class="paso">
          <span class="num">2</span>
          <p>Toca <strong>"Instalar"</strong> o <strong>"Añadir a pantalla de inicio"</strong></p>
        </div>
      </div>

    {:else}
      <!-- Chrome Android (más común) -->
      <div class="pasos">
        <div class="paso">
          <span class="num">1</span>
          <p>Toca el icono de <strong>menú</strong> (⋮) arriba a la derecha en Chrome</p>
        </div>
        <div class="paso">
          <span class="num">2</span>
          <p>Toca <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar app"</strong></p>
        </div>
        <div class="paso">
          <span class="num">3</span>
          <p>Toca <strong>"Instalar"</strong> — ¡listo!</p>
        </div>
      </div>
    {/if}

    <p class="nota">Una vez instalada, funciona sin internet y sin abrir el navegador.</p>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    z-index: 1000;
    display: flex;
    align-items: flex-end;
  }
  .modal {
    background: #1a1a1a;
    border-radius: 16px 16px 0 0;
    padding: 1.5rem;
    width: 100%;
    border-top: 3px solid #c0392b;
    position: relative;
  }
  .cerrar {
    position: absolute;
    top: 1rem; right: 1rem;
    background: #333; border: none;
    color: #aaa; width: 28px; height: 28px;
    border-radius: 50%; cursor: pointer;
    font-size: 0.85rem;
  }
  h2 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.25rem; }
  .sub { color: #888; font-size: 0.85rem; margin-bottom: 1.25rem; }
  .pasos { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.25rem; }
  .paso { display: flex; align-items: flex-start; gap: 0.75rem; }
  .num {
    flex-shrink: 0;
    width: 1.6rem; height: 1.6rem;
    background: #c0392b;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.8rem;
  }
  .paso p { color: #ccc; font-size: 0.9rem; line-height: 1.5; margin: 0; }
  .paso strong { color: #fff; }
  .nota {
    font-size: 0.8rem;
    color: #555;
    text-align: center;
    border-top: 1px solid #2a2a2a;
    padding-top: 1rem;
    margin-top: 0.5rem;
  }
</style>
