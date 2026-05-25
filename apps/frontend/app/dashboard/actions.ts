'use server'

// Dashboard-level server actions. publishEventAction flips a draft event
// to PUBLISHED via the gateway, then invalidates the dashboard + public
// event page so the new status shows up immediately.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../lib/api'

export type PublishState = { ok?: boolean; message?: string } | undefined

export async function publishEventAction(
  eventId: number,
  _prev: PublishState,
  _formData: FormData,
): Promise<PublishState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await apiFetch<unknown>(`/api/v1/events/${eventId}/publish`, {
    method: 'PATCH',
  })
  if (!result.ok) return { ok: false, message: result.error }

  revalidatePath('/dashboard')
  revalidatePath(`/e/${eventId}`)
  return { ok: true, message: 'Published' }
}
