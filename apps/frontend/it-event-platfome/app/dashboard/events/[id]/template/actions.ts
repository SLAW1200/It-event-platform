'use server'

import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../../../lib/api'
import { getTemplate } from '../../../../lib/templates'

// Used directly as a <form action>, so it must resolve to void. Failures are
// surfaced by redirecting back to the picker with an ?error= banner.
export async function applyTemplateAction(
  eventId: number,
  templateId: string,
): Promise<void> {
  const session = await getSession()
  if (!session) redirect('/login')

  const errUrl = (msg: string) =>
    `/dashboard/events/${eventId}/template?error=${encodeURIComponent(msg)}`

  const template = getTemplate(templateId)
  if (!template) redirect(errUrl('Unknown template'))

  const result = await apiFetch<unknown>(`/api/v1/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify({
      templateId,
      configuration: {
        tagline: template.tagline,
        enabledSections: template.defaultSections,
        paletteOverride: {},
      },
    }),
  })

  if (!result.ok) redirect(errUrl(result.error))
  redirect(`/dashboard/events/${eventId}/customize`)
}
