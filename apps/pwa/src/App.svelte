<script lang="ts">
  import { onMount } from 'svelte'
  import EstadoConexion from './components/EstadoConexion.svelte'
  import FormReporte from './components/FormReporte.svelte'
  import ListaReportes from './components/ListaReportes.svelte'
  import QRConectar from './components/QRConectar.svelte'
  import InstalarApp from './components/InstalarApp.svelte'
  import { reportes, vista } from './lib/store'
  import { obtenerReportes } from './lib/db'
  import { iniciarSyncAuto } from './lib/sync'

  let installPrompt: any = null
  let mostrarBannerInstalar = false
  let mostrarModalInstalar = false

  onMount(async () => {
    const locales = await obtenerReportes()
    reportes.set(locales)

    iniciarSyncAuto(async () => {
      const actualizados = await obtenerReportes()
      reportes.set(actualizados)
    })

    // Capturar el evento de instalación del navegador
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      installPrompt = e
      mostrarBannerInstalar = true
    })

    // Si ya está instalada como app, no mostrar el banner
    window.addEventListener('appinstalled', () => {
      mostrarBannerInstalar = false
      installPrompt = null
    })
  })

  async function instalarApp() {
    if (installPrompt) {
      // Chrome ya tiene el prompt listo — dispararlo directamente
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') mostrarBannerInstalar = false
      installPrompt = null
    } else {
      // Otros navegadores — mostrar instrucciones manuales
      mostrarModalInstalar = true
    }
  }
</script>

<div class="app">
  <header>
    <div class="logo">
      <span class="dot"></span>
      <h1>VOCES UNIDAS</h1>
    </div>
    <p class="tagline">Comunicación de emergencia</p>
  </header>

  <div class="banner-instalar" class:visible={mostrarBannerInstalar}>
    <span>📲 Instala la app para usarla sin internet</span>
    <button on:click={instalarApp}>Instalar</button>
    <button class="cerrar" on:click={() => mostrarBannerInstalar = false}>✕</button>
  </div>

  <!-- Botón fijo de instalar siempre visible para navegadores sin prompt -->
  {#if !mostrarBannerInstalar}
    <button class="btn-instalar-fijo" on:click={instalarApp}>
      📲 Instalar app
    </button>
  {/if}

  {#if mostrarModalInstalar}
    <InstalarApp onCerrar={() => mostrarModalInstalar = false} />
  {/if}

  <EstadoConexion />

  <main>
    {#if $vista === 'lista'}
      <ListaReportes />
    {:else if $vista === 'crear'}
      <FormReporte />
    {:else if $vista === 'conectar'}
      <QRConectar />
    {/if}
  </main>

  {#if $vista === 'lista'}
    <nav class="nav-bottom">
      <button on:click={() => vista.set('conectar')} class="nav-btn">
        <span>📡</span>
        <small>Conectar</small>
      </button>
      <button on:click={() => vista.set('crear')} class="nav-btn crear">
        <span>🔴</span>
        <small>Nueva alerta</small>
      </button>
      <button class="nav-btn" disabled>
        <span>📋</span>
        <small>Alertas</small>
      </button>
    </nav>
  {/if}
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #111;
    color: #eee;
    min-height: 100dvh;
  }

  .app {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    max-width: 600px;
    margin: 0 auto;
  }

  header {
    background: #1a1a1a;
    padding: 1rem 1.5rem 0.75rem;
    border-bottom: 1px solid #2a2a2a;
  }

  .logo { display: flex; align-items: center; gap: 0.5rem; }
  .dot {
    width: 12px; height: 12px;
    background: #e74c3c;
    border-radius: 50%;
    animation: pulso 2s infinite;
  }

  @keyframes pulso {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }

  .banner-instalar {
    display: none;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #c0392b;
    color: #fff;
    font-size: 0.9rem;
    flex-wrap: wrap;
  }
  .banner-instalar.visible { display: flex; }
  .banner-instalar span { flex: 1; }
  .banner-instalar button {
    background: #fff;
    color: #c0392b;
    border: none;
    padding: 0.35rem 0.9rem;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .banner-instalar .cerrar {
    background: transparent;
    color: rgba(255,255,255,0.7);
    padding: 0.35rem 0.5rem;
  }
  .btn-instalar-fijo {
    position: fixed;
    bottom: 5.5rem;
    right: 1rem;
    background: #c0392b;
    color: #fff;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(192,57,43,0.5);
    z-index: 50;
  }

  h1 { font-size: 1.1rem; font-weight: 800; letter-spacing: 0.05em; color: #fff; }
  .tagline { font-size: 0.75rem; color: #666; margin-top: 0.1rem; }

  main { flex: 1; overflow-y: auto; padding-bottom: 5rem; }

  .nav-bottom {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 600px;
    background: #1a1a1a;
    border-top: 1px solid #2a2a2a;
    display: flex;
    justify-content: space-around;
    padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom));
  }

  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-size: 1.25rem;
    transition: all 0.15s;
  }
  .nav-btn:hover { color: #fff; background: #2a2a2a; }
  .nav-btn.crear { color: #e74c3c; }
  .nav-btn:disabled { opacity: 0.5; cursor: default; }
  small { font-size: 0.65rem; }
</style>
