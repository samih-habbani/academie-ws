import { fr } from './fr'
import { en } from './en'
import type { Lang } from './config'

// Les clés sont celles du français ; chaque valeur devient un simple « string » (ou liste de string).
type Widen<T> = T extends string ? string : T extends readonly string[] ? string[] : { [K in keyof T]: Widen<T[K]> }
export type Dict = Widen<typeof fr>

const DICTIONARIES: Record<Lang, Dict> = { fr, en }

export const getDict = (lang: Lang): Dict => DICTIONARIES[lang]
