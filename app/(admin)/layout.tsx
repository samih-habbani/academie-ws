import { syne, dmSans } from '../fonts'
import '../globals.css'

// Racine du back-office : le site public a la sienne (app/(site)/[lang]/layout.tsx), car sa langue varie.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
