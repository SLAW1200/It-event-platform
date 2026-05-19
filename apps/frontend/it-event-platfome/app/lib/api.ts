import { cookies } from 'next/headers'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

async function authHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get('eventra_token')?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader()),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, error: 'Cannot reach the API. Is the gateway running?' }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
    const msg = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? `Request failed (HTTP ${res.status})`)
    return { ok: false, status: res.status, error: msg }
  }
  if (res.status === 204) return { ok: true, data: undefined as T }
  const data = (await res.json()) as T
  return { ok: true, data }
}

/**
 * Unauthenticated fetch for the public attendee surface (event page +
 * self-registration). Sends no cookie/Authorization header, so it can run
 * for visitors who have never signed in.
 */
export async function apiPublic<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, error: 'Cannot reach the API. Is the gateway running?' }
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
    const msg = Array.isArray(body.message)
      ? body.message.join(', ')
      : (body.message ?? `Request failed (HTTP ${res.status})`)
    return { ok: false, status: res.status, error: msg }
  }
  if (res.status === 204) return { ok: true, data: undefined as T }
  const data = (await res.json()) as T
  return { ok: true, data }
}

export type JwtPayload = { sub: number; email: string; role: string; iat: number; exp: number }

export async function getSession(): Promise<JwtPayload | null> {
  const token = (await cookies()).get('eventra_token')?.value
  if (!token) return null
  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return null
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const payload = JSON.parse(json) as JwtPayload
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export type ApiEvent = {
  id: number
  name: string
  description?: string
  startDate: string
  endDate: string
  venue?: string
  city?: string
  country?: string
  maxParticipants?: number
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | string
  templateId?: string | null
  configuration?: Record<string, unknown> | null
  organizerId: number
  createdAt: string
  updatedAt: string
}

/** GET /api/v1/registrations/event/:id/stats */
export type RegistrationStats = {
  eventId: number
  total: number
  byStatus: Partial<Record<'pending' | 'confirmed' | 'cancelled' | 'waitlisted' | 'checked_in', number>>
}

/** GET /api/v1/registrations/event/:id */
export type ApiRegistration = {
  id: number
  status: string
  amountPaid: number
  registrationDate: string
  user?: { id: number; firstName?: string; lastName?: string; email: string } | null
}

/** GET /api/v1/analytics/events/:id/dashboard */
export type EventAnalytics = {
  registrations: { total: number; confirmed: number; checkedIn: number; conversionRate: string; attendanceRate: string }
  revenue: { total: number; currency: string; avgPerRegistration: string }
  email: { sent: number; opened: number; clicked: number; openRate: string; clickRate: string }
}

/** GET /api/v1/checkin/event/:id/attendance */
export type EventAttendance = {
  eventId: number
  totalRegistrations: number
  checkedIn: number
  notCheckedIn: number
  attendanceRate: number
  recentCheckIns: Array<{
    id: number
    checkInTime: string
    checkInMethod?: string
    registration?: { id: number; user?: { firstName?: string; lastName?: string; email?: string } | null } | null
  }>
}

/** EmailCampaign (GET /api/v1/campaigns/event/:id) */
export type ApiCampaign = {
  id: number
  name: string
  subject: string
  status: string
  totalSent?: number
  totalOpened?: number
  totalClicked?: number
  createdAt: string
}

/** Task (GET /api/v1/tasks/event/:id/kanban) */
export type ApiTask = {
  id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | string
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string
  dueDate?: string | null
  assignedToId?: number | null
  assignedTo?: { firstName?: string; lastName?: string } | null
}
export type Kanban = Record<'todo' | 'in_progress' | 'review' | 'done', ApiTask[]>

/** SupportTicket (GET /api/v1/tickets) */
export type ApiTicket = {
  id: number
  subject: string
  description: string
  status: string
  priority: string
  channel?: string
  createdAt: string
  slaDueAt?: string | null
  user?: { firstName?: string; lastName?: string; email?: string } | null
  assignedTo?: { firstName?: string; lastName?: string } | null
}
export type TicketStats = { total: number; open: number; inProgress: number; resolved: number; closed: number }

/** User (GET /api/v1/users, /api/v1/networking/...) */
export type ApiUser = {
  id: number
  email: string
  firstName?: string
  lastName?: string
  company?: string
  jobTitle?: string
  role: string
  active: boolean
  createdAt?: string
}
export type Paginated<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number }

/** FormField (GET /api/v1/form-fields/event/:id) */
export type ApiFormField = {
  id: number
  eventId: number
  fieldName: string
  label: string
  fieldType: string
  placeholder?: string | null
  helpText?: string | null
  required: boolean
  options?: string[] | null
  orderIndex: number
}

/** GET /api/v1/notifications/log */
export type ApiNotification = {
  type: string
  title?: string
  message: string
  channel?: string
}
