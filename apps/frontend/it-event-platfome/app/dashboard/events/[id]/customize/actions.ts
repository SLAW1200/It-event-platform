'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent } from '../../../../lib/api'
import { ALL_SECTIONS, type SectionKey, type EventConfiguration } from '../../../../lib/templates'

export type CustomizeState =
  | { ok?: boolean; message?: string }
  | undefined

export async function saveCustomizationAction(
  eventId: number,
  _prev: CustomizeState,
  formData: FormData,
): Promise<CustomizeState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const tagline = String(formData.get('tagline') ?? '').trim()
  const primary = String(formData.get('primary') ?? '').trim()
  const accent = String(formData.get('accent') ?? '').trim()

  const enabledSections: SectionKey[] = ALL_SECTIONS.filter((s) =>
    formData.get(`section:${s}`) === 'on',
  )

  const configuration: EventConfiguration = {
    tagline: tagline || undefined,
    enabledSections,
    paletteOverride: {
      ...(primary ? { primary } : {}),
      ...(accent ? { accent } : {}),
    },
  }

  const result = await apiFetch<ApiEvent>(`/api/v1/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify({ configuration }),
  })

  if (!result.ok) return { ok: false, message: result.error }

  revalidatePath(`/dashboard/events/${eventId}/customize`)
  revalidatePath(`/e/${eventId}`)
  return { ok: true, message: 'Saved' }
}
