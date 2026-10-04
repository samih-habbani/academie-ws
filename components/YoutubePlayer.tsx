'use client'

import { getYoutubeEmbedUrl } from '@/lib/youtube'

export default function YoutubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const src = getYoutubeEmbedUrl(videoId)
  if (!src) return null

  return (
    <iframe
      src={src}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      title={title}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
