/**
 * Force-download an offline HTML file.
 * Browsers often ignore the HTML `download` attribute for same-origin .html
 * (they navigate instead). Fetching as a blob and creating an object URL
 * consistently saves the file.
 */
export async function downloadOfflineHtml(url: string, fileName: string): Promise<void> {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after the browser has started the download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000)
}
