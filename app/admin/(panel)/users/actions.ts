'use server'

import { z } from 'zod'
import { hash } from '@node-rs/argon2'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, redirectWithToast, type FormState } from '@/lib/admin/form'
import { ROLE_ADMIN, ROLE_USER, isAdmin, rolesOf } from '@/lib/admin/roles'

const MIN_PASSWORD = 10

const emailField = z
  .string()
  .trim()
  .min(1, 'L’email est obligatoire.')
  .max(180, 'L’email : 180 caractères maximum.')
  .pipe(z.email('Adresse email invalide.'))

/** Valide email + mot de passe en renvoyant toutes les erreurs d'un coup (pas seulement la première). */
function checkCredentials(emailInput: string, password: string, passwordRequired: boolean) {
  const errors: Record<string, string> = {}
  const email = emailField.safeParse(emailInput)
  if (!email.success) errors.email = email.error.issues[0]?.message ?? 'Email invalide.'

  if (password.length > 200) errors.password = 'Mot de passe trop long (200 caractères maximum).'
  else if (password.length < MIN_PASSWORD && (passwordRequired || password !== '')) {
    errors.password = passwordRequired ? `${MIN_PASSWORD} caractères minimum.` : `${MIN_PASSWORD} caractères minimum (ou laisse vide pour ne pas le changer).`
  }
  return { email: email.success ? email.data : '', errors }
}

const countAdmins = () => prisma.user.count({ where: { roles: { array_contains: [ROLE_ADMIN] } } })

/** Ne renvoie jamais le mot de passe saisi au navigateur dans l'état du formulaire. */
const scrub = (values: Record<string, string>): Record<string, string> => ({ ...values, password: '' })

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = scrub(formValues(formData))
  const password = String(formData.get('password') ?? '')

  const check = checkCredentials(values.email ?? '', password, true)
  if (Object.keys(check.errors).length > 0) return failure(values, check.errors)

  const taken = await prisma.user.findFirst({ where: { email: { equals: check.email, mode: 'insensitive' } }, select: { id: true } })
  if (taken) return failure(values, { email: 'Cet email est déjà utilisé.' })

  await prisma.user.create({
    data: {
      email: check.email,
      password: await hash(password),
      roles: values.admin === 'on' ? [ROLE_USER, ROLE_ADMIN] : [ROLE_USER],
    },
  })
  redirectWithToast('/admin/users', 'Utilisateur créé.')
}

export async function updateUser(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin()
  const values = scrub(formValues(formData))
  const password = String(formData.get('password') ?? '')

  const check = checkCredentials(values.email ?? '', password, false)
  if (Object.keys(check.errors).length > 0) return failure(values, check.errors)

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, roles: true } })
  if (!target) return failure(values, {}, 'Cet utilisateur n’existe plus.')

  const taken = await prisma.user.findFirst({
    where: { email: { equals: check.email, mode: 'insensitive' }, id: { not: id } },
    select: { id: true },
  })
  if (taken) return failure(values, { email: 'Cet email est déjà utilisé.' })

  const wantAdmin = values.admin === 'on'
  if (isAdmin(target.roles) && !wantAdmin) {
    if (target.id === me.id) return failure(values, { admin: 'Tu ne peux pas retirer ton propre rôle administrateur.' })
    if ((await countAdmins()) <= 1) return failure(values, { admin: 'Il doit rester au moins un administrateur.' })
  }

  // On conserve d'éventuels autres rôles : seul ROLE_ADMIN est ajouté ou retiré.
  const others = rolesOf(target.roles).filter((r) => r !== ROLE_ADMIN && r !== ROLE_USER)
  const roles = [ROLE_USER, ...others, ...(wantAdmin ? [ROLE_ADMIN] : [])]

  await prisma.user.update({
    where: { id },
    data: { email: check.email, roles, ...(password !== '' ? { password: await hash(password) } : {}) },
  })
  redirectWithToast('/admin/users', 'Utilisateur enregistré.')
}

export async function deleteUser(formData: FormData): Promise<{ error?: string } | void> {
  const me = await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }
  if (id === me.id) return { error: 'Tu ne peux pas supprimer ton propre compte.' }

  const target = await prisma.user.findUnique({ where: { id }, select: { roles: true } })
  if (!target) return { error: 'Cet utilisateur n’existe plus.' }
  if (isAdmin(target.roles) && (await countAdmins()) <= 1) return { error: 'Il doit rester au moins un administrateur.' }

  await prisma.user.delete({ where: { id } })
  redirectWithToast('/admin/users', 'Utilisateur supprimé.')
}
