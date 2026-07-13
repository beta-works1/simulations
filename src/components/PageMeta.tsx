import { Helmet } from 'react-helmet-async'

interface PageMetaProps {
  title: string
  description: string
  path?: string
}

const SITE_URL = 'https://simulations-ivory.vercel.app'

export function PageMeta({ title, description, path = '/' }: PageMetaProps) {
  const url = `${SITE_URL}${path}`
  const fullTitle = title.includes('SimLab') ? title : `${title} | SimLab`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SimLab Interactive Simulations" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE_URL}/og-image.svg`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
