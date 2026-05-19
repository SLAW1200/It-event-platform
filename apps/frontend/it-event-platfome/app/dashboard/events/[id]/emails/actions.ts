'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiRegistration } from '../../../../lib/api'

export type EmailState =
  | { ok?: boolean; message?: string; errors?: { name?: string; subject?: string; content?: string } }
  | undefined

export async function createCampaignAction(
  eventId: number,
  _prev: EmailState,
  formData: FormData,
): Promise<EmailState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()

  const errors: NonNullable<EmailState>['errors'] = {}
  if (!name) errors.name = 'Required'
  if (!subject) errors.subject = 'Required'
  if (!content) errors.content = 'Required'
  if (Object.keys(errors).length > 0) return { errors }

  const res = await apiFetch<unknown>('/api/v1/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      name,
      subject,
      content,
      htmlContent: `<div style="font-family:sans-serif;line-height:1.6">${content.replace(/\n/g, '<br/>')}</div>`,
    }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/emails`)
  return { ok: true, message: 'Campaign created' }
}

export async function sendCampaignAction(
  eventId: number,
  campaignId: number,
  _prev: EmailState,
  _formData: FormData,
): Promise<EmailState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const regs = await apiFetch<ApiRegistration[]>(`/api/v1/registrations/event/${eventId}`)
  if (!regs.ok) return { ok: false, message: regs.error }

  const seen = new Set<string>()
  const recipients = regs.data
    .map((r) => r.user)
    .filter((u): u is NonNullable<typeof u> => Boolean(u?.email))
    .filter((u) => (seen.has(u.email) ? false : (seen.add(u.email), true)))
    .map((u) => ({ email: u.email, name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() }))

  if (recipients.length === 0) return { ok: false, message: 'No registrants to send to yet' }

  const res = await apiFetch<{ sent: number; failed: number }>(
    `/api/v1/campaigns/${campaignId}/send`,
    { method: 'POST', body: JSON.stringify({ recipients }) },
  )
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/emails`)
  return { ok: true, message: `Sent ${res.data.sent}, failed ${res.data.failed}` }
}
