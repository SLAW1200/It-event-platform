'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../../../lib/api'

export type FormState =
  | { ok?: boolean; message?: string; errors?: { label?: string; fieldName?: string } }
  | undefined

const SLUG = /^[a-z][a-z0-9_]*$/

export async function createFormFieldAction(
  eventId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const label = String(formData.get('label') ?? '').trim()
  const fieldName = String(formData.get('fieldName') ?? '').trim()
  const fieldType = String(formData.get('fieldType') ?? 'text')
  const required = formData.get('required') === 'on'
  const placeholder = String(formData.get('placeholder') ?? '').trim()
  const optionsRaw = String(formData.get('options') ?? '').trim()

  const errors: NonNullable<FormState>['errors'] = {}
  if (!label) errors.label = 'Required'
  if (!fieldName) errors.fieldName = 'Required'
  else if (!SLUG.test(fieldName)) errors.fieldName = 'lowercase letters, digits, _ (start with a letter)'
  if (Object.keys(errors).length > 0) return { errors }

  const options = ['select', 'multiselect', 'radio'].includes(fieldType)
    ? optionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined

  const res = await apiFetch<unknown>('/api/v1/form-fields', {
    method: 'POST',
    body: JSON.stringify({
      eventId,
      label,
      fieldName,
      fieldType,
      required,
      placeholder: placeholder || undefined,
      options,
    }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/forms`)
  return { ok: true, message: 'Field added' }
}

export async function deleteFormFieldAction(
  eventId: number,
  fieldId: number,
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const res = await apiFetch<unknown>(`/api/v1/form-fields/${fieldId}`, { method: 'DELETE' })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/forms`)
  return { ok: true }
}
