<script lang="ts">
  export let installPrompt: any
  export let onInstalado: () => void
  export let onCerrar: () => void

  const ua = navigator.userAgent
  const esIOS     = /iphone|ipad|ipod/i.test(ua)
  const esSamsung = /samsungbrowser/i.test(ua)
  const esFirefox = /firefox/i.test(ua)

  async function instalar() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') onInstalado()
  }
</script>

<div class="overlay" on:click={onCerrar}>
  <div class="modal" on:click|stopPropagation>
    <button class="cerrar" on:click={onCerrar}>✕</button>

    {#if installPrompt}
      <!-- Chrome tiene el prompt listo — un solo botón -->
      <div class="directo">
        <div class="icono">📲</div>
        <h2>Instalar VOCES UNIDAS</h2>
        <p class="sub">Se instalará como app en tu teléfono. Funciona sin internet.</p>
        <button class="btn-instalar" on:click={instalar}>Instalar ahora</button>
      </div>

    {:else}
      <!-- Instrucciones según navegador -->
      <div class="manual">
        <div class="icono">📲</div>
        <h2>Instalar en tu teléfono</h2>
        <p class="sub">Sigue estos pasos — tarda menos de 30 segundos:</p>

        {#if esIOS}
          <div class="pasos">
            <div class="paso"><span class="num">1</span><p>Toca el botón <strong>compartir ⎙</strong> en la barra inferior de Safari</p></div>
            <div class="paso"><span class="num">2</span><p>Toca <strong>"Añadir a pantalla de inicio"</strong></p></div>
            <div class="paso"><span class="num">3</span><p>Toca <strong>"Añadir"</strong> — ¡listo!</p></div>
          </div>
        {:else if esSamsung}
          <div class="pasos">
            <div class="paso"><span class="num">1</span><p>Toca el menú <strong>(⋮)</strong> arriba a la derecha</p></div>
            <div class="paso"><span class="num">2</span><p>Toca <strong>"Añadir página a"</strong> → <strong>"Pantalla de inicio"</strong></p></div>
            <div class="paso"><span class="num">3</span><p>Toca <strong>"Añadir"</strong> — ¡listo!</p></div>
          </div>
        {:else if esFirefox}
          <div class="pasos">
            <div class="paso"><span class="num">1</span><p>Toca el menú <strong>(⋮)</strong> arriba a la derecha</p></div>
            <div class="paso"><span class="num">2</span><p>Toca <strong>"Instalar"</strong> — ¡listo!</p></div>
          </div>
        {:else}
          <!-- Chrome -->
          <div class="pasos">
            <div class="paso"><span class="num">1</span><p>Toca el menú <strong>(⋮)</strong> arriba a la derecha</p></div>
            <div class="paso"><span class="num">2</span><p>Toca <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla de inicio"</strong></p></div>
            <div class="paso"><span class="num">3</span><p>Toca <strong>"Instalar"</strong> — ¡listo!</p></div>
          </div>
        {/if}

        <p class="nota">Una vez instalada funciona completamente sin internet.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 1000;
    display: flex; align-items: flex-end;
  }
  .modal {
    background: #1a1a1a;
    border-radius: 20px 20px 0 0;
    padding: 2rem 1.5rem 2.5rem;
    width: 100%;
    border-top: 3px solid #c0392b;
    position: relative;
  }
  .cerrar {
    position: absolute; top: 1rem; right: 1rem;
    background: #2a2a2a; border: none; color: #888;
    width: 30px; height: 30px; border-radius: 50%;
    cursor: pointer; font-size: 0.9rem;
  }
  .icono { font-size: 3rem; text-align: center; display: block; margin-bottom: 0.75rem; }
  h2 { font-size: 1.2rem; font-weight: 800; text-align: center; margin-bottom: 0.35rem; }
  .sub { color: #888; font-size: 0.85rem; text-align: center; margin-bottom: 1.5rem; }

  /* Directo (Chrome con prompt) */
  .directo { text-align: center; }
  .btn-instalar {
    width: 100%; padding: 0.9rem;
    background: #c0392b; color: #fff;
    border: none; border-radius: 10px;
    font-size: 1.1rem; font-weight: 800;
    cursor: pointer; margin-top: 0.5rem;
  }

  /* Manual */
  .pasos { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.25rem; }
  .paso { display: flex; align-items: flex-start; gap: 0.75rem; }
  .num {
    flex-shrink: 0; width: 1.6rem; height: 1.6rem;
    background: #c0392b; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.8rem;
  }
  .paso p { color: #ccc; font-size: 0.9rem; line-height: 1.5; margin: 0; }
  .paso strong { color: #fff; }
  .nota {
    font-size: 0.8rem; color: #555; text-align: center;
    border-top: 1px solid #2a2a2a; padding-top: 1rem; margin-top: 0.5rem;
  }
</style>
