import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import AdminShell from '../_components/AdminShell'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Les pages et les actions revérifient l'accès elles-mêmes (un layout n'est pas rendu à chaque navigation).
  const [admin, unread] = await Promise.all([requireAdmin(), prisma.contact.count({ where: { isRead: false } })])
  return (
    <AdminShell email={admin.email} unread={unread}>
      {children}
    </AdminShell>
  )
}
