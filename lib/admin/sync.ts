import { prisma } from '@/lib/db'

/** Le nombre de chapitres affiché sur les cartes suit le nombre de chapitres disponibles du cours. */
export async function syncChapterCount(courseId: number) {
  const count = await prisma.chapter.count({ where: { courseId, available: true } })
  await prisma.course.updateMany({ where: { id: courseId }, data: { chapterCount: count } })
}

/** N'accepte que des chemins internes du back-office comme destination de redirection (jamais d'URL externe). */
export function safeReturn(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^\/admin(\/[A-Za-z0-9_\-\/\[\]]*)?(\?[A-Za-z0-9_\-=&%.+]*)?$/.test(value) ? value : fallback
}
