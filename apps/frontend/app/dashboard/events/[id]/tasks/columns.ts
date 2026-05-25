// Canonical kanban column order + labels. Kept in its own (non-'use client')
// module so BOTH the server page and the client widgets can import it: a
// 'use client' module can only expose components to a Server Component, not
// plain data — importing a const array across that boundary yields a client
// reference proxy, not the array (COLUMNS.reduce/.map would throw).
export const COLUMNS: { key: string; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]
