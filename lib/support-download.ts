import { getDownloadUrl } from '@vercel/blob'

/**
 * Lien de téléchargement du support, ou null s'il n'y a pas de support exploitable.
 * Une valeur qui n'est pas une URL (ex. un nom de fichier saisi à la main en base) ne doit pas
 * faire planter la page du cours : le bouton est simplement masqué.
 */
export function supportDownloadUrl(supportUrl: string | null): string | null {
  if (!supportUrl) return null
  try {
    return getDownloadUrl(supportUrl)
  } catch {
    return null
  }
}
