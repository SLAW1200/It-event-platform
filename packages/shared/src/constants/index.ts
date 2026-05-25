// Cross-service constants. Keeping the literal names here avoids typos that
// would silently break routing (a misspelled queue name just drops messages).

// Microservice client names used by ClientsModule.register / the gateway router.
export const SERVICES = {
  USER: 'USER_SERVICE',
  EVENT: 'EVENT_SERVICE',
  REGISTRATION: 'REGISTRATION_SERVICE',
  EMAIL: 'EMAIL_SERVICE',
  CHECKIN: 'CHECKIN_SERVICE',
  NOTIFICATION: 'NOTIFICATION_SERVICE',
  ANALYTICS: 'ANALYTICS_SERVICE',
  FILE: 'FILE_SERVICE',
  TASK: 'TASK_SERVICE',
  SUPPORT: 'SUPPORT_SERVICE',
  NETWORKING: 'NETWORKING_SERVICE',
} as const;

// Producers and consumers must agree on these exact strings.
export const QUEUES = {
  EMAIL: 'email_queue',
  NOTIFICATION: 'notification_queue',
  ANALYTICS: 'analytics_queue',
  REGISTRATION: 'registration_queue',
} as const;

// Broker topics, named <aggregate>.<past-tense-verb>.
export const EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  REGISTRATION_CREATED: 'registration.created',
  REGISTRATION_CONFIRMED: 'registration.confirmed',
  CHECKIN_COMPLETED: 'checkin.completed',
  TICKET_CREATED: 'ticket.created',
  TICKET_ESCALATED: 'ticket.escalated',
  PAYMENT_COMPLETED: 'payment.completed',
} as const;

// Redis key builders — functions so the format stays identical on every read/write.
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  EVENT: (id: string) => `event:${id}`,
  EVENT_LIST: (page: number) => `events:page:${page}`,
  REGISTRATION: (id: string) => `registration:${id}`,
  ATTENDANCE: (eventId: string) => `attendance:${eventId}`,
} as const;

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  DAY: 86400,       // 24 hours
} as const;
