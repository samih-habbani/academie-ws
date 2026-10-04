/** URLs publiques du site (explicites, en anglais). */
export const courseUrl = (slug: string) => `/course/${slug}`
export const chapterUrl = (courseSlug: string, chapterId: number) => `/course/${courseSlug}/chapter/${chapterId}`
export const themeUrl = (slug: string) => `/theme/${slug}`
