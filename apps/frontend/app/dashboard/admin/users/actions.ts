'use server'

// Admin server actions for user management: change role, toggle active.
// Both PATCH user-service via the gateway and revalidate the user list so
// the table updates without a client-side refetch.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../../lib/api'

export type AdminState = { ok?: boolean; message?: string } | undefined

export async function setRoleAction(
  userId: number,
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const role = String(formData.get('role') ?? '')
  const res = await apiFetch<unknown>(`/api/v1/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath('/dashboard/admin/users')
  return { ok: true }
}

export async function toggleActiveAction(
  userId: number,
  active: boolean,
  _prev: AdminState,
  _formData: FormData,
): Promise<AdminState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const res = await apiFetch<unknown>(`/api/v1/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath('/dashboard/admin/users')
  return { ok: true }
}
