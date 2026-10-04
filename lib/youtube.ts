const VIDEO_ID = /^[\w-]{11}$/

/**
 * Extrait l'identifiant d'une vidéo YouTube depuis un lien (watch, youtu.be, embed) ou un identifiant seul.
 * Renvoie null pour toute autre valeur (ex. un ancien bloc <iframe> Vimeo encore en base), afin de ne
 * jamais construire une URL d'intégration invalide.
 */
export function getYoutubeVideoId(urlOrId: string): string | null {
  const value = urlOrId.trim()
  const patterns = [
    /youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})(?![\w-])/,
    /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})(?![\w-])/,
    /youtu\.be\/([\w-]{11})(?![\w-])/,
  ]
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return match[1]
  }
  return VIDEO_ID.test(value) ? value : null
}

export function getYoutubeEmbedUrl(urlOrId: string): string | null {
  const videoId = getYoutubeVideoId(urlOrId)
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null
}
