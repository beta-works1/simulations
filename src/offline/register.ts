/** Register the PWA service worker (vite-plugin-pwa virtual module). */
export async function registerOfflineWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return
  try {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({ immediate: true })
  } catch {
    /* virtual module unavailable outside production plugin build */
  }
}
