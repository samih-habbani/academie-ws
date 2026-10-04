// Règles partagées entre le navigateur (avant l'envoi) et le serveur (génération du jeton d'upload).

export const MAX_SUPPORT_BYTES = 100 * 1024 * 1024 // 100 Mo

/** Extensions autorisées → type MIME envoyé à Vercel Blob. */
export const SUPPORT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  '7z': 'application/x-7z-compressed',
  rar: 'application/vnd.rar',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  odt: 'application/vnd.oasis.opendocument.text',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  txt: 'text/plain',
}

/** Types acceptés côté serveur (les navigateurs en envoient parfois des variantes pour .zip / .rar). */
export const ALLOWED_CONTENT_TYPES = [
  ...Object.values(SUPPORT_TYPES),
  'application/x-zip-compressed',
  'application/x-rar-compressed',
]

export const SUPPORT_EXTENSIONS = Object.keys(SUPPORT_TYPES)

/** Chemin attendu dans le stockage : supports/cours-<id>/<nom-de-fichier-sans-accents>.<ext> */
export const SUPPORT_PATH_REGEX = /^supports\/cours-(\d+)\/[A-Za-z0-9._() -]{1,120}$/

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

/**
 * Vrai seulement si l'URL est en https, hébergée sur un store Vercel Blob public et rangée dans
 * le dossier du cours attendu : empêche d'enregistrer en base une URL arbitraire (autre site, autre cours).
 */
export function isSupportBlobUrl(url: string, courseId: number): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.username === '' &&
    parsed.password === '' &&
    parsed.hostname.endsWith(BLOB_HOST_SUFFIX) &&
    parsed.pathname.startsWith(`/supports/cours-${courseId}/`)
  )
}

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase()
}

/** Nom de fichier sûr : sans accents, caractères autorisés uniquement, extension conservée. */
export function safeFileName(fileName: string): string {
  const ext = extensionOf(fileName)
  const base = fileName.slice(0, fileName.length - (ext ? ext.length + 1 : 0))
  const cleaned = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._() -]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
  return `${cleaned || 'support'}.${ext}`
}
