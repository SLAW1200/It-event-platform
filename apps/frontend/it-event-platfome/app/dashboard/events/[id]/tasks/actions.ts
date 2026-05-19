'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiFetch, getSession } from '../../../../lib/api'

export type TaskState =
  | { ok?: boolean; message?: string; errors?: { title?: string } }
  | undefined

export async function createTaskAction(
  eventId: number,
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const priority = String(formData.get('priority') ?? 'medium')
  if (!title) return { errors: { title: 'Required' } }

  const res = await apiFetch<unknown>('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify({ eventId, title, description: description || undefined, priority }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/tasks`)
  return { ok: true, message: 'Task added' }
}

export async function moveTaskAction(
  eventId: number,
  taskId: number,
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const session = await getSession()
  if (!session) redirect('/login')

  const status = String(formData.get('status') ?? '')
  const res = await apiFetch<unknown>(`/api/v1/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) return { ok: false, message: res.error }

  revalidatePath(`/dashboard/events/${eventId}/tasks`)
  return { ok: true }
}
