import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getAdmin } from '@/lib/admin-auth'
import { ALLOWED_CONTENT_TYPES, MAX_SUPPORT_BYTES, SUPPORT_EXTENSIONS, SUPPORT_PATH_REGEX, extensionOf } from '@/lib/support-files'

/**
 * Délivre un jeton d'upload à usage unique pour que le navigateur envoie le fichier DIRECTEMENT
 * à Vercel Blob (les fonctions Vercel refusent les corps de plus de 4,5 Mo).
 * Seul un admin connecté peut obtenir ce jeton, et uniquement pour un chemin de support valide.
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

        const match = SUPPORT_PATH_REGEX.exec(pathname)
        if (!match) throw new Error('Chemin de fichier invalide.')

        const payload = JSON.parse(clientPayload ?? '{}') as { courseId?: number }
        if (payload.courseId !== Number(match[1])) throw new Error('Cours incohérent avec le chemin.')

        if (!SUPPORT_EXTENSIONS.includes(extensionOf(pathname))) throw new Error('Type de fichier non autorisé.')

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SUPPORT_BYTES,
          addRandomSuffix: true, // jamais d'écrasement : une URL change à chaque nouvel envoi (pas de cache périmé)
        }
      },
    })
    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message === 'Non autorisé.' ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
