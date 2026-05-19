'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../../lib/api'

export type NotifyState = { ok?: boolean; message?: string } | undefined

export async function sendNotificationAction(
  _prev: NotifyState,
  formData: FormData,
): Promise<NotifyState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const type = String(formData.get('type') ?? 'slack')
  const title = String(formData.get('title') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  if (!message) return { ok: false, message: 'Message is required' }

  const res = await apiFetch<{ success: boolean }>('/api/v1/notifications', {
    method: 'POST',
    body: JSON.stringify({ type, title: title || undefined, message }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath('/dashboard/admin/notifications')
  return { ok: true, message: 'Notification dispatched' }
}
