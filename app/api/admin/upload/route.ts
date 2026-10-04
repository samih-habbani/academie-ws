import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getAdmin } from '@/lib/admin-auth'
import {
  ALLOWED_CONTENT_TYPES,
  IMAGE_CONTENT_TYPES,
  IMAGE_EXTENSIONS,
  IMAGE_PATH_REGEX,
  MAX_IMAGE_BYTES,
  MAX_SUPPORT_BYTES,
  SUPPORT_EXTENSIONS,
  SUPPORT_PATH_REGEX,
  extensionOf,
} from '@/lib/support-files'

/**
 * Délivre un jeton d'upload à usage unique pour que le navigateur envoie le fichier DIRECTEMENT
 * à Vercel Blob (les fonctions Vercel refusent les corps de plus de 4,5 Mo).
 * Seul un admin connecté peut obtenir ce jeton, et uniquement pour un chemin valide :
 *  - supports de cours : supports/cours-<id>/<nom>.<ext>
 *  - images            : images/<courses|categories|themes>/<nom>.<ext>
 */
export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const admin = await getAdmin()
        if (!admin) throw new Error('Non autorisé.')

        const ext = extensionOf(pathname)

        const supportMatch = SUPPORT_PATH_REGEX.exec(pathname)
        if (supportMatch) {
          const payload = JSON.parse(clientPayload ?? '{}') as { courseId?: number }
          if (payload.courseId !== Number(supportMatch[1])) throw new Error('Cours incohérent avec le chemin.')
          if (!SUPPORT_EXTENSIONS.includes(ext)) throw new Error('Type de fichier non autorisé.')
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_SUPPORT_BYTES,
            addRandomSuffix: true, // jamais d'écrasement : l'URL change à chaque envoi (pas de cache périmé)
          }
        }

        if (IMAGE_PATH_REGEX.test(pathname)) {
          if (!IMAGE_EXTENSIONS.includes(ext)) throw new Error("Type d'image non autorisé.")
          return {
            allowedContentTypes: IMAGE_CONTENT_TYPES,
            maximumSizeInBytes: MAX_IMAGE_BYTES,
            addRandomSuffix: true,
          }
        }

        throw new Error('Chemin de fichier invalide.')
      },
    })
    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message === 'Non autorisé.' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
