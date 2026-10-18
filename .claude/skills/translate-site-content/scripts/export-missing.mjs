#!/usr/bin/env node
// Liste les textes français à traduire (jamais traduits, ou modifiés depuis leur traduction).
// usage : node export-missing.mjs <lang> [sortie.json]      (depuis la racine du projet)
// Sortie : { lang, texts: [{ id, fr }], items: [{ entity, entityId, field, textId, stale }] }
//   - texts   = textes français UNIQUES (« 00 - Présentation » n'est à traduire qu'une fois)
//   - items   = où chaque texte est utilisé (pour réimporter la traduction au bon endroit)
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const lang = process.argv[2]
const out = process.argv[3]
if (!lang) { console.error('usage : export-missing.mjs <lang> [sortie.json]'); process.exit(1) }

const prisma = new PrismaClient()
const retry = async (fn) => { for (let i = 1; ; i++) { try { return await fn() } catch (e) { if (i >= 6) throw e; await new Promise((r) => setTimeout(r, 2500 * i)) } } }
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)
const usable = (v) => typeof v === 'string' && v.trim() !== '' && v.trim() !== 'null'

;(async () => {
  const [categories, themes, courses, chapters, existing] = await Promise.all([
    retry(() => prisma.category.findMany({ select: { id: true, title: true, description: true } })),
    retry(() => prisma.theme.findMany({ select: { id: true, title: true, description: true } })),
    retry(() => prisma.course.findMany({ select: { id: true, title: true, description: true } })),
    retry(() => prisma.chapter.findMany({ select: { id: true, title: true, chapterPart: true } })),
    retry(() => prisma.translation.findMany({ where: { lang }, select: { entity: true, entityId: true, field: true, sourceHash: true } })),
  ])
  const done = new Map(existing.map((t) => [`${t.entity}:${t.entityId}:${t.field}`, t.sourceHash]))

  const candidates = []
  const add = (entity, row, fields) => {
    for (const field of fields) if (usable(row[field])) candidates.push({ entity, entityId: row.id, field, fr: row[field].trim() })
  }
  categories.forEach((r) => add('category', r, ['title', 'description']))
  themes.forEach((r) => add('theme', r, ['title', 'description']))
  courses.forEach((r) => add('course', r, ['title', 'description']))
  chapters.forEach((r) => add('chapter', r, ['title', 'chapterPart']))

  const texts = []; const idByText = new Map(); const items = []
  for (const c of candidates) {
    const known = done.get(`${c.entity}:${c.entityId}:${c.field}`)
    const h = hash(c.fr)
    if (known === h) continue // à jour
    if (!idByText.has(c.fr)) { idByText.set(c.fr, texts.length); texts.push({ id: texts.length, fr: c.fr }) }
    items.push({ entity: c.entity, entityId: c.entityId, field: c.field, textId: idByText.get(c.fr), stale: known !== undefined })
  }
  const result = { lang, texts, items }
  if (out) writeFileSync(out, JSON.stringify(result))
  const chars = texts.reduce((s, t) => s + t.fr.length, 0)
  console.log(`${lang} : ${items.length} champs à traduire (dont ${items.filter((i) => i.stale).length} modifiés depuis), ${texts.length} textes uniques, ${chars} caractères.`)
  const byEntity = {}
  items.forEach((i) => { const k = `${i.entity}.${i.field}`; byEntity[k] = (byEntity[k] ?? 0) + 1 })
  console.log(byEntity)
  await prisma.$disconnect()
})().catch((e) => { console.error(e); process.exit(1) })
