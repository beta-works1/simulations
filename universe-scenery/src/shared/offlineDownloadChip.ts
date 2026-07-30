import { downloadOfflineHtml } from './downloadOfflineHtml.js'

/**
 * Floating “Download offline HTML” chip for SceneryStack single-file sims.
 * Sits above the bottom nav so it does not cover the stage or side panels.
 * Uses blob download because browsers ignore `download` on same-origin HTML.
 */
export function installOfflineDownloadChip(fileName?: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  if (window.location.protocol === 'file:') return
  if (document.getElementById('simlab-offline-download')) return

  const href = window.location.pathname
  const name =
    fileName ??
    (href.split('/').pop()?.endsWith('.html')
      ? href.split('/').pop()!
      : 'simlab-offline.html')

  const chip = document.createElement('button')
  chip.id = 'simlab-offline-download'
  chip.type = 'button'
  chip.textContent = '↓ Download offline HTML'
  chip.setAttribute('aria-label', 'Download this simulation as an offline HTML file')
  chip.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:56px',
    'transform:translateX(-50%)',
    'z-index:2147483646',
    'display:inline-flex',
    'align-items:center',
    'gap:6px',
    'padding:8px 14px',
    'border-radius:999px',
    'border:1px solid rgba(148,163,184,0.45)',
    'background:rgba(11,22,40,0.94)',
    'color:#f8fafc',
    'font:600 12px/1.2 system-ui,-apple-system,Segoe UI,sans-serif',
    'text-decoration:none',
    'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
    'cursor:pointer',
  ].join(';')

  let busy = false
  chip.addEventListener('click', async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (busy) return
    busy = true
    const prev = chip.textContent
    chip.textContent = 'Downloading…'
    chip.disabled = true
    try {
      await downloadOfflineHtml(href, name)
      chip.textContent = 'Saved ✓'
      window.setTimeout(() => {
        chip.textContent = prev
        chip.disabled = false
        busy = false
      }, 1400)
    } catch {
      chip.textContent = 'Download failed'
      window.setTimeout(() => {
        chip.textContent = prev
        chip.disabled = false
        busy = false
      }, 1800)
    }
  })

  const mount = () => {
    if (!document.body.contains(chip)) document.body.appendChild(chip)
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount)
}
