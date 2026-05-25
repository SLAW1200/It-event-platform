// Client-safe constants (no server-only imports) — safe to import from
// 'use client' components. Keep this free of next/headers, cookies, etc.

export const FORM_FIELD_TYPES = [
  'text', 'email', 'phone', 'number', 'date',
  'select', 'multiselect', 'checkbox', 'radio', 'textarea', 'file',
] as const

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]
