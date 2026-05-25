// Per-event email console — lists existing campaigns with engagement
// counts (sent/opened/clicked) and exposes the "new campaign" form.
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent, type ApiCampaign } from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'
import { CreateCampaignForm, SendButton } from './email-forms'

export const dynamic = 'force-dynamic'

const CAMPAIGN_BADGE: Record<string, string> = {
  draft: 'bg-surface-3 text-muted',
  scheduled: 'bg-warning/10 text-warning',
  sending: 'bg-warning/10 text-warning',
  sent: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
}

export default async function EmailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const [evtRes, campRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<ApiCampaign[]>(`/api/v1/campaigns/event/${eventId}`),
  ])
  const eventName = evtRes.ok ? evtRes.data.name : `Event #${eventId}`
  const campaigns = campRes.ok ? campRes.data : []

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={eventName} active="emails" />

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Email campaigns</h1>
        <p className="mt-2 text-sm text-muted">
          Create a campaign and send it to everyone registered for this event.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <CreateCampaignForm eventId={eventId} />

          <div className="card overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Campaigns</h2>
            </div>
            {!campRes.ok ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-danger">{campRes.error}</p>
            ) : campaigns.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                No campaigns yet — create one on the left.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {campaigns.map((c) => {
                  const st = String(c.status ?? '').toLowerCase()
                  return (
                    <li key={c.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.name}</p>
                          <p className="truncate text-xs text-muted">{c.subject}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CAMPAIGN_BADGE[st] ?? 'bg-surface-3 text-muted'}`}>
                          {st || 'draft'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-faint">
                          Sent {c.totalSent ?? 0} · Opened {c.totalOpened ?? 0} · Clicked {c.totalClicked ?? 0}
                        </p>
                        <SendButton eventId={eventId} campaignId={c.id} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
