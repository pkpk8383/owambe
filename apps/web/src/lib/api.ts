import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR (auto token refresh) ───────
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data;

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        // Update zustand store
        const { useAuthStore } = await import('@/store/auth.store');
        const state = useAuthStore.getState();
        if (state.user) {
          state.setAuth(state.user, accessToken);
        }

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        const { useAuthStore } = await import('@/store/auth.store');
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ─── TYPED API HELPERS ───────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const eventsApi = {
  list: (params?: any) => api.get('/events', { params }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  publish: (id: string) => api.post(`/events/${id}/publish`),
  delete: (id: string) => api.delete(`/events/${id}`),
  getPublic: (slug: string) => api.get(`/events/public/${slug}`),
  registerAttendee: (slug: string, data: any) => api.post(`/events/public/${slug}/register`, data),
};

export const vendorsApi = {
  search: (params?: any) => api.get('/vendors/search', { params }),
  getProfile: (slug: string) => api.get(`/vendors/profile/${slug}`),
  getMyProfile: () => api.get('/vendors/me'),
  create: (data: any) => api.post('/vendors/me', data),
  update: (data: any) => api.put('/vendors/me', data),
  setupBank: (data: any) => api.post('/vendors/me/bank-account', data),
  getAvailability: (vendorId: string, params: any) => api.get(`/vendors/${vendorId}/availability`, { params }),
  setAvailability: (dates: any[]) => api.put('/vendors/me/availability', { dates }),
  addPackage: (data: any) => api.post('/vendors/me/packages', data),
  generateBio: (data: any) => api.post('/vendors/generate-bio', data),
};

export const bookingsApi = {
  list: (params?: any) => api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  createInstant: (data: any) => api.post('/bookings/instant', data),
  createRfq: (data: any) => api.post('/bookings/rfq', data),
  confirm: (id: string) => api.post(`/bookings/${id}/confirm`),
  cancel: (id: string, reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  submitQuote: (id: string, data: any) => api.post(`/bookings/${id}/quote`, data),
  getMessages: (id: string) => api.get(`/bookings/${id}/messages`),
  sendMessage: (id: string, body: string) => api.post(`/bookings/${id}/messages`, { body }),
};

export const ticketsApi = {
  list: (eventId: string) => api.get(`/tickets/event/${eventId}`),
  create: (eventId: string, data: any) => api.post(`/tickets/event/${eventId}`, data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  delete: (id: string) => api.delete(`/tickets/${id}`),
  setStatus: (id: string, status: string) => api.patch(`/tickets/${id}/status`, { status }),
};

export const promosApi = {
  list: (eventId: string) => api.get(`/promos/event/${eventId}`),
  create: (eventId: string, data: any) => api.post(`/promos/event/${eventId}`, data),
  validate: (code: string, eventId: string, ticketPrice?: number) =>
    api.post('/promos/validate', { code, eventId, ticketPrice }),
  delete: (id: string) => api.delete(`/promos/${id}`),
  update: (id: string, data: any) => api.put(`/promos/${id}`, data),
};

export const waitlistApi = {
  join: (data: any) => api.post('/waitlist/join', data),
  list: (eventId: string) => api.get(`/waitlist/event/${eventId}`),
  notify: (eventId: string, count?: number) => api.post(`/waitlist/notify/${eventId}`, { count }),
  remove: (id: string) => api.delete(`/waitlist/${id}`),
};

export const attendeesApi = {
  list: (eventId: string, params?: any) => api.get(`/attendees/event/${eventId}`, { params }),
  checkIn: (data: { qrCode: string; eventId: string }) => api.post('/attendees/checkin', data),
  getTicket: (qrCode: string) => api.get(`/attendees/ticket/${qrCode}`),
};

export const speakersApi = {
  list: (eventId: string) => api.get(`/speakers/event/${eventId}`),
  create: (eventId: string, data: any) => api.post(`/speakers/event/${eventId}`, data),
  update: (id: string, data: any) => api.put(`/speakers/${id}`, data),
  delete: (id: string) => api.delete(`/speakers/${id}`),
  updateChecklist: (id: string, data: any) => api.patch(`/speakers/${id}/checklist`, data),
};

export const sponsorsApi = {
  list: (eventId: string) => api.get(`/sponsors/event/${eventId}`),
  create: (eventId: string, data: any) => api.post(`/sponsors/event/${eventId}`, data),
  delete: (id: string) => api.delete(`/sponsors/${id}`),
};

export const emailsApi = {
  list: (eventId: string) => api.get(`/emails/event/${eventId}`),
  create: (eventId: string, data: any) => api.post(`/emails/event/${eventId}`, data),
  send: (eventId: string, campaignId: string) => api.post(`/emails/event/${eventId}/send/${campaignId}`),
  generateCopy: (data: any) => api.post('/emails/ai-generate', data),
};

export const analyticsApi = {
  plannerOverview: () => api.get('/analytics/planner/overview'),
  eventStats: (eventId: string) => api.get(`/analytics/events/${eventId}`),
  checkInLive: (eventId: string) => api.get(`/analytics/events/${eventId}/checkin-live`),
  vendorRevenue: () => api.get('/analytics/vendor/revenue'),
};

export const aiApi = {
  generateEventCopy: (prompt: string) => api.post('/ai/event-copy', { prompt }),
  planIntake: (message: string, conversationHistory: any[]) =>
    api.post('/ai/plan/intake', { message, conversationHistory }),
  generatePlan: (data: any) => api.post('/ai/plan/generate', data),
};

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  portfolio: (files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('images', f));
    return api.post('/upload/portfolio', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};
