'use server'

import { apiPublic } from '../../lib/api'

export type RegisterState =
  | {
      ok?: boolean
      message?: string
      errors?: { firstName?: string; lastName?: string; email?: string }
      values?: { firstName?: string; lastName?: string; email?: string }
      confirmation?: { status: string; qrCodeUrl: string | null; name: string; email: string }
    }
  | undefined

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type GuestResponse = { user: { id: number; firstName: string; lastName: string } }
type RegistrationResponse = { id: number; status: string; qrCodeUrl?: string | null }

export async function registerAttendeeAction(
  eventId: number,
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()

  const errors: NonNullable<RegisterState>['errors'] = {}
  if (!firstName) errors.firstName = 'Required'
  if (!lastName) errors.lastName = 'Required'
  if (!email) errors.email = 'Required'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email'
  if (Object.keys(errors).length > 0) {
    return { errors, values: { firstName, lastName, email } }
  }

  // 1. Resolve (or create) a lightweight attendee identity.
  const guest = await apiPublic<GuestResponse>('/api/v1/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ email, firstName, lastName }),
  })
  if (!guest.ok) {
    return { message: guest.error, values: { firstName, lastName, email } }
  }

  // 2. Attach the registration (QR code is generated server-side).
  const reg = await apiPublic<RegistrationResponse>('/api/v1/public/register', {
    method: 'POST',
    body: JSON.stringify({ eventId, userId: guest.data.user.id }),
  })
  if (!reg.ok) {
    return { message: reg.error, values: { firstName, lastName, email } }
  }

  return {
    ok: true,
    confirmation: {
      status: reg.data.status,
      qrCodeUrl: reg.data.qrCodeUrl ?? null,
      name: `${firstName} ${lastName}`,
      email,
    },
  }
}
