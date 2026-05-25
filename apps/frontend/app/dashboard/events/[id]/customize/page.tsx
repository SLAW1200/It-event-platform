// Customise page — server component that fetches the current event,
// resolves its template/palette/section list, and hands them to the
// client-side <CustomizerForm /> for editing.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent } from '../../../../lib/api'
import {
  getTemplate, ALL_SECTIONS, SECTION_LABELS, resolveSections, resolvePalette,
  type EventConfiguration,
} from '../../../../lib/templates'
import { CustomizerForm } from './customizer-form'

export const dynamic = 'force-dynamic'

export default async function CustomizePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const evt = await apiFetch<ApiEvent>(`/api/v1/events/${eventId}`)
  if (!evt.ok) {
    return (
      <main className="container-page py-16">
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {evt.error}
        </p>
        <Link href="/dashboard" className="btn btn-ghost mt-4">← Back</Link>
      </main>
    )
  }

  const template = getTemplate(evt.data.templateId)
  if (!template) {
    redirect(`/dashboard/events/${eventId}/template`)
  }

  const config = (evt.data.configuration ?? {}) as EventConfiguration
  const palette = resolvePalette(template, config)
  const enabledSections = resolveSections(template, config)

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
            <span className="text-sm font-medium">{evt.data.name}</span>
            <span className="pill text-xs">
              <span className="size-1.5 rounded-full" style={{ background: template.palette.primary }} />
              {template.name}
            </span>
          </div>
          <Link href={`/dashboard/events/${eventId}/template`} className="btn btn-ghost h-9 px-3.5 text-sm">
            Change template
          </Link>
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-4rem)] grid-cols-1 lg:grid-cols-[420px_1fr]">
        <aside className="border-b border-border bg-surface-2 lg:border-b-0 lg:border-r">
          <CustomizerForm
            eventId={eventId}
            allSections={ALL_SECTIONS}
            sectionLabels={SECTION_LABELS}
            initialTagline={config.tagline ?? template.tagline}
            initialPrimary={palette.primary}
            initialAccent={palette.accent}
            initialEnabledSections={enabledSections}
          />
        </aside>
        <section className="bg-background-2">
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-2.5">
            <span className="text-xs font-medium uppercase tracking-widest text-faint">Live preview</span>
            <Link href={`/e/${eventId}`} target="_blank" className="text-xs text-brand hover:underline">
              Open in new tab ↗
            </Link>
          </div>
          <iframe
            id="preview-frame"
            src={`/e/${eventId}`}
            title="Event preview"
            className="h-[calc(100dvh-7rem)] w-full bg-white"
          />
        </section>
      </div>
    </main>
  )
}
