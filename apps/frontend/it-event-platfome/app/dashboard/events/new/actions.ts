'use server'

import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent } from '../../../lib/api'

export type CreateEventState =
  | {
      errors?: { name?: string; startDate?: string; endDate?: string; venue?: string; maxParticipants?: string }
      message?: string
      values?: { name?: string; startDate?: string; endDate?: string; venue?: string; maxParticipants?: string }
    }
  | undefined

export async function createEventAction(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const startDate = String(formData.get('startDate') ?? '')
  const endDate = String(formData.get('endDate') ?? '')
  const venue = String(formData.get('venue') ?? '').trim() || undefined
  const maxRaw = String(formData.get('maxParticipants') ?? '').trim()

  const errors: NonNullable<CreateEventState>['errors'] = {}
  if (!name) errors.name = 'Event name is required'
  if (!startDate) errors.startDate = 'Start date is required'
  if (!endDate) errors.endDate = 'End date is required'
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    errors.endDate = 'End must be on or after start'
  }
  let maxParticipants: number | undefined
  if (maxRaw) {
    const n = Number(maxRaw)
    if (!Number.isFinite(n) || n <= 0) errors.maxParticipants = 'Must be a positive number'
    else maxParticipants = Math.floor(n)
  }
  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, startDate, endDate, venue, maxParticipants: maxRaw } }
  }

  const result = await apiFetch<ApiEvent>(
    `/api/v1/events?organizerId=${session.sub}`,
    {
      method: 'POST',
      body: JSON.stringify({
        name,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        venue,
        maxParticipants,
      }),
    },
  )

  if (!result.ok) {
    return {
      message: result.error,
      values: { name, startDate, endDate, venue, maxParticipants: maxRaw },
    }
  }

  redirect(`/dashboard/events/${result.data.id}/template`)
}
