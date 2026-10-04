import { del } from '@vercel/blob'
import { isOwnBlobUrl } from '@/lib/support-files'

/** Supprime un fichier du stockage s'il vient bien de notre store (best effort : une erreur n'interrompt rien). */
export async function deleteBlobIfOwned(url: string | null | undefined) {
  if (url && isOwnBlobUrl(url)) await del(url).catch(() => undefined)
}
