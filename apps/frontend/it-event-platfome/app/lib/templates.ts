export type SectionKey =
  | 'hero'
  | 'about'
  | 'schedule'
  | 'speakers'
  | 'sponsors'
  | 'register'
  | 'location'
  | 'faq'

export type Palette = {
  primary: string
  accent: string
  surface: string
  text: string
}

export type Template = {
  id: 'tech-conf' | 'workshop' | 'meetup' | 'hackathon'
  name: string
  tagline: string
  description: string
  palette: Palette
  heroStyle: 'gradient' | 'mesh' | 'split' | 'solid'
  defaultSections: SectionKey[]
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero',
  about: 'About',
  schedule: 'Schedule',
  speakers: 'Speakers',
  sponsors: 'Sponsors',
  register: 'Register',
  location: 'Location',
  faq: 'FAQ',
}

export const ALL_SECTIONS: SectionKey[] = [
  'hero', 'about', 'schedule', 'speakers', 'sponsors', 'register', 'location', 'faq',
]

export const TEMPLATES: Template[] = [
  {
    id: 'tech-conf',
    name: 'Tech Conference',
    tagline: 'The future, in person.',
    description: 'Multi-day conference with talks, speakers, sponsors and live streaming.',
    palette: { primary: '#7c3aed', accent: '#06b6d4', surface: '#0e0e15', text: '#ededf3' },
    heroStyle: 'gradient',
    defaultSections: ['hero', 'about', 'speakers', 'schedule', 'sponsors', 'location', 'register'],
  },
  {
    id: 'workshop',
    name: 'Hands-on Workshop',
    tagline: 'Build something today.',
    description: 'Single-day workshop with prerequisites, materials, and small-group format.',
    palette: { primary: '#0891b2', accent: '#f59e0b', surface: '#ffffff', text: '#0b0b14' },
    heroStyle: 'split',
    defaultSections: ['hero', 'about', 'schedule', 'location', 'register', 'faq'],
  },
  {
    id: 'meetup',
    name: 'Casual Meetup',
    tagline: 'Come for the talk, stay for the people.',
    description: 'Single talk plus networking. Warm, approachable, no fuss.',
    palette: { primary: '#dc2626', accent: '#f59e0b', surface: '#fef3c7', text: '#0b0b14' },
    heroStyle: 'solid',
    defaultSections: ['hero', 'about', 'register', 'location'],
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    tagline: 'Ship in 48 hours.',
    description: 'Teams, prizes, mentor sessions, and an intense schedule.',
    palette: { primary: '#15803d', accent: '#22d3ee', surface: '#06160f', text: '#ededf3' },
    heroStyle: 'mesh',
    defaultSections: ['hero', 'about', 'schedule', 'sponsors', 'register', 'faq'],
  },
]

export function getTemplate(id: string | null | undefined): Template | null {
  if (!id) return null
  return TEMPLATES.find((t) => t.id === id) ?? null
}

export type EventConfiguration = {
  tagline?: string
  enabledSections?: SectionKey[]
  paletteOverride?: Partial<Palette>
}

export function resolvePalette(template: Template, config: EventConfiguration | null | undefined): Palette {
  return { ...template.palette, ...(config?.paletteOverride ?? {}) }
}

export function resolveSections(template: Template, config: EventConfiguration | null | undefined): SectionKey[] {
  return config?.enabledSections && config.enabledSections.length > 0
    ? config.enabledSections
    : template.defaultSections
}
