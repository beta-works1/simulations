import './SceneryEmbedViewer.css'

interface SceneryEmbedViewerProps {
  src: string
  title: string
}

/** Embeds a SceneryStack single-file sim (PhET-style) in an iframe. */
export function SceneryEmbedViewer({ src, title }: SceneryEmbedViewerProps) {
  return (
    <iframe
      className="scenery-embed"
      src={src}
      title={`${title} — SceneryStack simulation`}
      loading="lazy"
      allow="fullscreen"
    />
  )
}
