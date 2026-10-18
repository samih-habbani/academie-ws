#!/usr/bin/env node
// Enregistre en base les traductions faites pour l'export de export-missing.mjs.
// usage : node import-translations.mjs <export.json> <traductions.txt> [<autre.txt> …] [--apply]
// Format des fichiers de traduction : une ligne par texte, « id|traduction » (les sauts de ligne sont écrits « ⏎ »).
// Sans --apply : simple vérification (aucune écriture).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const [exportFile, ...translationFiles] = args.filter((a) => !a.startsWith('--'))
if (!exportFile || translationFiles.length === 0) { console.error('usage : import-translations.mjs <export.json> <traductions.txt>… [--apply]'); process.exit(1) }

const prisma = new PrismaClient()
const retry = async (fn) => { for (let i = 1; ; i++) { try { return await fn() } catch (e) { if (i >= 6) throw e; await new Promise((r) => setTimeout(r, 2500 * i)) } } }
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)

const { lang, texts, items } = JSON.parse(readFileSync(exportFile, 'utf8'))
const translations = new Map()
for (const file of translationFiles) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const i = line.indexOf('|')
    if (i < 1) continue
    const id = Number(line.slice(0, i))
    if (!Number.isInteger(id)) continue
    translations.set(id, line.slice(i + 1).replace(/[ ]*⏎[ ]*/g, '\n').trim())
  }
}

const missing = texts.filter((t) => !translations.has(t.id) || translations.get(t.id) === '')
const rows = items.filter((it) => translations.get(it.textId)).map((it) => {
  const fr = texts[it.textId].fr
  return { entity: it.entity, entityId: it.entityId, field: it.field, text: translations.get(it.textId), hash: hash(fr) }
})
console.log(`${lang} : ${translations.size} traductions lues, ${rows.length}/${items.length} champs prêts, ${missing.length} textes sans traduction.`)
if (missing.length) console.log('Textes manquants (ids) :', missing.slice(0, 40).map((t) => t.id).join(', '), missing.length > 40 ? '…' : '')
// Contrôle : une traduction ne doit pas être identique au français par accident (hors noms propres / titres courts)
const same = [...translations].filter(([id, tr]) => texts[id] && texts[id].fr === tr && tr.length > 40)
if (same.length) console.log(`À vérifier : ${same.length} traductions longues identiques au français (ids ${same.slice(0, 10).map(([id]) => id).join(', ')}).`)

if (!apply) { console.log('(aperçu : rien n’a été écrit — relance avec --apply)'); await prisma.$disconnect(); process.exit(0) }

const CHUNK = 400
let written = 0
for (let i = 0; i < rows.length; i += CHUNK) {
  const part = rows.slice(i, i + CHUNK)
  await retry(() => prisma.$executeRaw`
    INSERT INTO translation (entity, entity_id, field, lang, text, source_hash, updated_at)
    SELECT e, i, f, ${lang}, t, h, NOW()
    FROM unnest(${part.map((r) => r.entity)}::text[], ${part.map((r) => r.entityId)}::int[], ${part.map((r) => r.field)}::text[], ${part.map((r) => r.text)}::text[], ${part.map((r) => r.hash)}::text[]) AS x(e, i, f, t, h)
    ON CONFLICT (entity, entity_id, field, lang)
    DO UPDATE SET text = EXCLUDED.text, source_hash = EXCLUDED.source_hash, updated_at = NOW()`)
  written += part.length
}
console.log(`Enregistré : ${written} traductions (${lang}).`)
await prisma.$disconnect()
