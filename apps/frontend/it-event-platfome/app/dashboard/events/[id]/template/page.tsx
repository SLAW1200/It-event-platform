import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent } from '../../../../lib/api'
import { TEMPLATES, type Template } from '../../../../lib/templates'
import { applyTemplateAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function TemplatePickerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const { error } = await searchParams
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

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
        </div>
      </header>

      <section className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="pill mx-auto">Step 2 of 3 · Pick a template</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Choose a starting point for <span className="text-gradient">{evt.data.name}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">You can tweak everything in the next step.</p>
        </div>

        {error && (
          <p
            role="alert"
            className="mx-auto mt-8 max-w-md rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-center text-sm text-danger"
          >
            {error}
          </p>
        )}

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <TemplateCard
                template={t}
                eventId={eventId}
                isSelected={evt.data.templateId === t.id}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

function TemplateCard({
  template, eventId, isSelected,
}: {
  template: Template; eventId: number; isSelected: boolean;
}) {
  const apply = applyTemplateAction.bind(null, eventId, template.id)
  return (
    <article className={`card card-hover overflow-hidden p-0 ${isSelected ? 'ring-brand' : ''}`}>
      <TemplatePreview template={template} />
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{template.name}</h3>
          {isSelected && <span className="text-[0.7rem] font-medium uppercase tracking-wide text-success">Current</span>}
        </div>
        <p className="mt-2 text-sm text-muted">{template.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {template.defaultSections.map((s) => (
            <span key={s} className="rounded-full border border-border-2 bg-surface-2 px-2 py-0.5 text-[0.7rem] text-muted">
              {s}
            </span>
          ))}
        </div>
        <form action={apply} className="mt-6">
          <button type="submit" className="btn btn-primary w-full">
            {isSelected ? 'Continue customizing' : `Use ${template.name}`}
          </button>
        </form>
      </div>
    </article>
  )
}

function TemplatePreview({ template }: { template: Template }) {
  const { primary, accent, surface, text } = template.palette
  const bg =
    template.heroStyle === 'gradient'
      ? `linear-gradient(135deg, ${primary}, ${accent})`
      : template.heroStyle === 'mesh'
      ? `radial-gradient(60% 80% at 20% 20%, ${primary}40 0%, transparent 60%), radial-gradient(60% 80% at 80% 70%, ${accent}40 0%, transparent 60%), ${surface}`
      : template.heroStyle === 'split'
      ? `linear-gradient(90deg, ${surface} 50%, ${primary}20 50%)`
      : surface

  return (
    <div className="relative h-44 overflow-hidden" style={{ background: bg, color: text }}>
      <div className="absolute inset-0 p-5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: accent }} />
          <span className="text-[0.7rem] font-medium uppercase tracking-widest opacity-80">{template.name}</span>
        </div>
        <p className="mt-6 max-w-[18ch] text-xl font-semibold leading-tight">{template.tagline}</p>
        <div className="absolute bottom-4 left-5 flex gap-1.5">
          <span className="size-1.5 rounded-full bg-current opacity-40" />
          <span className="size-1.5 rounded-full bg-current opacity-60" />
          <span className="size-1.5 rounded-full bg-current opacity-90" />
        </div>
      </div>
    </div>
  )
}
