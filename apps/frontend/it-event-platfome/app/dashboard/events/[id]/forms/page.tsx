import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent, type ApiFormField } from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'
import { CreateFieldForm, DeleteFieldButton } from './form-widgets'

export const dynamic = 'force-dynamic'

export default async function FormsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const [evtRes, fieldsRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<ApiFormField[]>(`/api/v1/form-fields/event/${eventId}`),
  ])
  const eventName = evtRes.ok ? evtRes.data.name : `Event #${eventId}`
  const fields = fieldsRes.ok ? fieldsRes.data : []

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={eventName} active="forms" />

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Registration form</h1>
        <p className="mt-2 text-sm text-muted">
          Custom fields collected from attendees, in addition to name &amp; email.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <CreateFieldForm eventId={eventId} />

          <div className="card overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Fields ({fields.length})</h2>
            </div>
            {!fieldsRes.ok ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-danger">{fieldsRes.error}</p>
            ) : fields.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                No custom fields yet — add one on the left.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {fields.map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {f.label}
                        {f.required && <span className="ml-1.5 text-danger">*</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        <code className="font-mono">{f.fieldName}</code> · {f.fieldType}
                        {f.options?.length ? ` · ${f.options.join(', ')}` : ''}
                      </p>
                    </div>
                    <DeleteFieldButton eventId={eventId} fieldId={f.id} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
