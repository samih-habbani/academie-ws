export function getYoutubeVideoId(urlOrId: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtu\.be\/)([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern)
    if (match) return match[1]
  }
  return urlOrId
}

export function getYoutubeEmbedUrl(urlOrId: string): string {
  const videoId = getYoutubeVideoId(urlOrId)
  return `https://www.youtube.com/embed/${videoId}?rel=0`
}
