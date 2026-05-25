// Per-event analytics page. Pulls the dashboard summary plus the three
// timeline/breakdown series from analytics-service in parallel, then
// renders them server-side. force-dynamic prevents per-user caching.
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent, type EventAnalytics } from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'

export const dynamic = 'force-dynamic'

type TimelineRow = { date?: string; hour?: string; count: string | number }
type PricingRow = { tier: string | null; count: string | number; revenue: string | null }

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const [evtRes, dashRes, regTlRes, priceRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<EventAnalytics>(`/api/v1/analytics/events/${eventId}/dashboard`),
    apiFetch<TimelineRow[]>(`/api/v1/analytics/events/${eventId}/registrations/timeline`),
    apiFetch<PricingRow[]>(`/api/v1/analytics/events/${eventId}/pricing-breakdown`),
  ])

  const eventName = evtRes.ok ? evtRes.data.name : `Event #${eventId}`
  const d = dashRes.ok ? dashRes.data : null
  const timeline = regTlRes.ok ? regTlRes.data : []
  const pricing = priceRes.ok ? priceRes.data : []
  const maxCount = Math.max(1, ...timeline.map((r) => Number(r.count) || 0))

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={eventName} active="analytics" />

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

        {!dashRes.ok ? (
          <p role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {dashRes.error}
          </p>
        ) : d ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Total registrations" value={d.registrations.total} />
              <Kpi label="Confirmed" value={d.registrations.confirmed} sub={`${d.registrations.conversionRate}% conversion`} />
              <Kpi label="Checked in" value={d.registrations.checkedIn} sub={`${d.registrations.attendanceRate}% attendance`} />
              <Kpi label="Revenue" value={`$${Number(d.revenue.total).toLocaleString()}`} sub={`avg $${d.revenue.avgPerRegistration}`} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Emails sent" value={d.email.sent} />
              <Kpi label="Open rate" value={`${d.email.openRate}%`} />
              <Kpi label="Click rate" value={`${d.email.clickRate}%`} />
              <Kpi label="Currency" value={d.revenue.currency} />
            </div>
          </>
        ) : null}

        <div className="card mt-8 p-6">
          <h2 className="text-sm font-semibold">Registrations over time</h2>
          {timeline.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No registrations yet.</p>
          ) : (
            <div className="mt-6 flex h-44 items-end gap-2">
              {timeline.map((r, i) => {
                const n = Number(r.count) || 0
                const h = Math.round((n / maxCount) * 100)
                const day = r.date ? new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `#${i + 1}`
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-md"
                        style={{ height: `${Math.max(4, h)}%`, background: 'var(--grad-brand)' }}
                        title={`${n} on ${day}`}
                      />
                    </div>
                    <span className="text-[0.65rem] text-faint">{day}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card mt-4 overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Revenue by pricing tier</h2>
          </div>
          {pricing.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No pricing data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                  <th className="px-5 py-3 font-medium">Tier</th>
                  <th className="px-5 py-3 font-medium">Registrations</th>
                  <th className="px-5 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{p.tier ?? 'Standard'}</td>
                    <td className="px-5 py-3 text-muted">{Number(p.count) || 0}</td>
                    <td className="px-5 py-3 text-muted">${Number(p.revenue ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[0.7rem] uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}
