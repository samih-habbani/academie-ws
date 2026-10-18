import { Syne, DM_Sans } from 'next/font/google'

// Polices auto-hébergées au build : plus de requête vers Google, plus de CSS bloquant.
// Variables (une seule fonte couvre toute la plage de graisses) → moins de fichiers.
export const syne = Syne({ subsets: ['latin'], display: 'swap', variable: '--font-syne' })
export const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans' })
