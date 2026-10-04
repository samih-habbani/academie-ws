export type MediaFolder = 'courses' | 'categories' | 'themes'

/**
 * Une image est soit un nom de fichier rangé dans /public/uploads/images/<dossier>/ (cas historique),
 * soit une URL complète (images téléversées depuis le back-office vers Vercel Blob).
 */
export function mediaSrc(folder: MediaFolder, value: string): string {
  return /^https?:\/\//i.test(value) ? value : `/uploads/images/${folder}/${value}`
}
