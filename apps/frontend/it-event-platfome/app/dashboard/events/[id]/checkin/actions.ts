'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../../../lib/api'

export type CheckInState = { ok?: boolean; message?: string } | undefined

export async function manualCheckInAction(
  eventId: number,
  registrationId: number,
  _prev: CheckInState,
  _formData: FormData,
): Promise<CheckInState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const res = await apiFetch<unknown>('/api/v1/checkin/manual', {
    method: 'POST',
    body: JSON.stringify({ registrationId, staffId: session.sub }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/checkin`)
  return { ok: true, message: 'Checked in' }
}
