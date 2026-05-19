'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../lib/api'

export type SupportState = { ok?: boolean; message?: string } | undefined

export async function ticketOpAction(
  ticketId: number,
  op: 'resolve' | 'close' | 'escalate',
  _prev: SupportState,
  _formData: FormData,
): Promise<SupportState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const res = await apiFetch<unknown>(`/api/v1/tickets/${ticketId}/${op}`, { method: 'PATCH' })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath('/dashboard/support')
  return { ok: true }
}

export type CreateTicketState =
  | { ok?: boolean; message?: string; errors?: { subject?: string; description?: string } }
  | undefined

export async function createTicketAction(
  _prev: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const subject = String(formData.get('subject') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const priority = String(formData.get('priority') ?? 'medium')

  const errors: NonNullable<CreateTicketState>['errors'] = {}
  if (!subject) errors.subject = 'Required'
  if (!description) errors.description = 'Required'
  if (Object.keys(errors).length > 0) return { errors }

  const res = await apiFetch<unknown>('/api/v1/tickets', {
    method: 'POST',
    body: JSON.stringify({ userId: session.sub, subject, description, priority, channel: 'web' }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath('/dashboard/support')
  return { ok: true, message: 'Ticket created' }
}
