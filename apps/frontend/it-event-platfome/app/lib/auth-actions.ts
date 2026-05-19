'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

export type AuthState =
  | {
      errors?: { email?: string; firstName?: string; lastName?: string; password?: string }
      message?: string
      values?: { email?: string; firstName?: string; lastName?: string }
    }
  | undefined

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('eventra_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const errors: NonNullable<AuthState>['errors'] = {}
  if (!nonEmpty(email)) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email'
  if (!nonEmpty(firstName)) errors.firstName = 'First name is required'
  if (!nonEmpty(lastName)) errors.lastName = 'Last name is required'
  if (password.length < 8) errors.password = 'Password must be at least 8 characters'
  if (Object.keys(errors).length > 0) {
    return { errors, values: { email, firstName, lastName } }
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName, lastName, password }),
      cache: 'no-store',
    })
  } catch {
    return {
      message: 'Cannot reach the API. Is the backend running on port 3000?',
      values: { email, firstName, lastName },
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message
    return {
      message: msg || `Registration failed (HTTP ${res.status})`,
      values: { email, firstName, lastName },
    }
  }

  const data = (await res.json()) as { accessToken?: string }
  if (data.accessToken) await setSessionCookie(data.accessToken)

  redirect('/dashboard')
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const errors: NonNullable<AuthState>['errors'] = {}
  if (!nonEmpty(email)) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email'
  if (!nonEmpty(password)) errors.password = 'Password is required'
  if (Object.keys(errors).length > 0) {
    return { errors, values: { email } }
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })
  } catch {
    return {
      message: 'Cannot reach the API. Is the backend running on port 3000?',
      values: { email },
    }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message
    return {
      message: msg || `Login failed (HTTP ${res.status})`,
      values: { email },
    }
  }

  const data = (await res.json()) as { accessToken?: string }
  if (data.accessToken) await setSessionCookie(data.accessToken)

  redirect('/dashboard')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('eventra_token')
  redirect('/login')
}
