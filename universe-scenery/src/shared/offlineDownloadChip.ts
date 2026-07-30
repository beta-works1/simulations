/**
 * Floating “Download offline HTML” chip for SceneryStack single-file sims.
 * Appears when the sim is opened from the site (http/https) so teachers can
 * save the PhET-style offline file without hunting through the catalog.
 * Hidden on file:// because the visitor already has the downloaded file open.
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

  const chip = document.createElement('a')
  chip.id = 'simlab-offline-download'
  chip.href = href
  chip.download = name
  chip.textContent = 'Download offline HTML'
  chip.setAttribute('aria-label', 'Download this simulation as an offline HTML file')
  chip.style.cssText = [
    'position:fixed',
    'top:10px',
    'right:10px',
    'z-index:2147483646',
    'display:inline-flex',
    'align-items:center',
    'gap:6px',
    'padding:8px 12px',
    'border-radius:999px',
    'border:1px solid rgba(148,163,184,0.45)',
    'background:rgba(11,22,40,0.92)',
    'color:#f8fafc',
    'font:600 12px/1.2 system-ui,-apple-system,Segoe UI,sans-serif',
    'text-decoration:none',
    'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
    'cursor:pointer',
  ].join(';')

  const mount = () => {
    if (!document.body.contains(chip)) document.body.appendChild(chip)
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount)
}
