import { getYoutubeVideoId } from '@/lib/youtube'

export type VideoMeta = { title: string | null; author: string | null }

/** Adresse YouTube normalisée : https://www.youtube.com/watch?v=<id> (null si ce n'est pas une vidéo YouTube). */
export function normalizeYoutube(input: string): { videoId: string; url: string } | null {
  const videoId = getYoutubeVideoId(input)
  return videoId ? { videoId, url: `https://www.youtube.com/watch?v=${videoId}` } : null
}

/** Titre et chaîne d'une vidéo via l'oEmbed public de YouTube (sans clé API). Échec silencieux : le lien reste enregistré. */
export async function fetchYoutubeMeta(url: string): Promise<VideoMeta> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    if (!res.ok) return { title: null, author: null }
    const data = (await res.json()) as { title?: string; author_name?: string }
    return { title: data.title?.slice(0, 255) ?? null, author: data.author_name?.slice(0, 120) ?? null }
  } catch {
    return { title: null, author: null }
  }
}
