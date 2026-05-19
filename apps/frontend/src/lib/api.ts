import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  register: (data: any) => api.post('/api/v1/auth/register', data),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: any) => api.get('/api/v1/events', { params }),
  get: (id: number) => api.get(`/api/v1/events/${id}`),
  create: (data: any) => api.post('/api/v1/events', data),
  update: (id: number, data: any) => api.put(`/api/v1/events/${id}`, data),
  publish: (id: number) => api.patch(`/api/v1/events/${id}/publish`),
  cancel: (id: number) => api.patch(`/api/v1/events/${id}/cancel`),
  stats: (id: number) => api.get(`/api/v1/events/${id}/stats`),
  delete: (id: number) => api.delete(`/api/v1/events/${id}`),
};

// ─── Registrations ────────────────────────────────────────────────────────────
export const registrationsApi = {
  create: (data: any) => api.post('/api/v1/registrations', data),
  byEvent: (eventId: number) => api.get(`/api/v1/registrations/event/${eventId}`),
  byUser: (userId: number) => api.get(`/api/v1/registrations/user/${userId}`),
  get: (id: number) => api.get(`/api/v1/registrations/${id}`),
  confirm: (id: number) => api.patch(`/api/v1/registrations/${id}/confirm`),
  cancel: (id: number) => api.patch(`/api/v1/registrations/${id}/cancel`),
  stats: (eventId: number) => api.get(`/api/v1/registrations/event/${eventId}/stats`),
};

// ─── Check-in ─────────────────────────────────────────────────────────────────
export const checkInApi = {
  qr: (qrPayload: string, staffId: number) =>
    api.post('/api/v1/checkin/qr', { qrPayload, staffId }),
  manual: (registrationId: number, staffId: number) =>
    api.post('/api/v1/checkin/manual', { registrationId, staffId }),
  attendance: (eventId: number) => api.get(`/api/v1/checkin/event/${eventId}/attendance`),
};

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaignsApi = {
  list: (eventId: number) => api.get(`/api/v1/campaigns/event/${eventId}`),
  get: (id: number) => api.get(`/api/v1/campaigns/${id}`),
  create: (data: any) => api.post('/api/v1/campaigns', data),
  update: (id: number, data: any) => api.put(`/api/v1/campaigns/${id}`, data),
  send: (id: number, data: any) => api.post(`/api/v1/campaigns/${id}/send`, data),
  analytics: (id: number) => api.get(`/api/v1/campaigns/${id}/analytics`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (eventId: number) => api.get(`/api/v1/tasks/event/${eventId}`),
  kanban: (eventId: number) => api.get(`/api/v1/tasks/event/${eventId}/kanban`),
  create: (data: any) => api.post('/api/v1/tasks', data),
  update: (id: number, data: any) => api.put(`/api/v1/tasks/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/api/v1/tasks/${id}/status`, { status }),
  addComment: (id: number, data: any) => api.post(`/api/v1/tasks/${id}/comments`, data),
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const supportApi = {
  list: (params?: any) => api.get('/api/v1/tickets', { params }),
  get: (id: number) => api.get(`/api/v1/tickets/${id}`),
  create: (data: any) => api.post('/api/v1/tickets', data),
  reply: (id: number, data: any) => api.post(`/api/v1/tickets/${id}/reply`, data),
  resolve: (id: number) => api.patch(`/api/v1/tickets/${id}/resolve`),
  escalate: (id: number) => api.patch(`/api/v1/tickets/${id}/escalate`),
  stats: () => api.get('/api/v1/tickets/stats'),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: (eventId: number) => api.get(`/api/v1/analytics/events/${eventId}/dashboard`),
  registrationTimeline: (eventId: number) =>
    api.get(`/api/v1/analytics/events/${eventId}/registrations/timeline`),
  checkInTimeline: (eventId: number) =>
    api.get(`/api/v1/analytics/events/${eventId}/checkins/timeline`),
  platform: () => api.get('/api/v1/analytics/platform'),
};

// ─── Networking ────────────────────────────────────────────────────────────────
export const networkingApi = {
  search: (eventId: number, q?: string) =>
    api.get(`/api/v1/networking/events/${eventId}/participants`, { params: { q } }),
  getProfile: (userId: number) => api.get(`/api/v1/networking/profiles/${userId}`),
  updateProfile: (userId: number, data: any) =>
    api.put(`/api/v1/networking/profiles/${userId}`, data),
  getMatches: (eventId: number, userId: number) =>
    api.get(`/api/v1/networking/events/${eventId}/matches/${userId}`),
  scheduleMeeting: (data: any) => api.post('/api/v1/networking/meetings', data),
  getMeetings: (userId: number) => api.get(`/api/v1/networking/meetings/user/${userId}`),
};

// ─── Files ────────────────────────────────────────────────────────────────────
export const filesApi = {
  uploadCover: (eventId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/v1/files/events/${eventId}/cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAvatar: (userId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/v1/files/users/${userId}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
