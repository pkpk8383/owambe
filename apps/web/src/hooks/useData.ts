import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  eventsApi, attendeesApi, vendorsApi, bookingsApi,
  analyticsApi, speakersApi, sponsorsApi, emailsApi, aiApi
} from '@/lib/api';

// ─── EVENTS ──────────────────────────────────────────
export function useMyEvents(params?: any) {
  return useQuery({
    queryKey: ['my-events', params],
    queryFn: () => eventsApi.list(params).then(r => r.data),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function usePublicEvent(slug: string) {
  return useQuery({
    queryKey: ['public-event', slug],
    queryFn: () => eventsApi.getPublic(slug).then(r => r.data),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── VENDORS ─────────────────────────────────────────
export function useVendorSearch(params?: any) {
  return useQuery({
    queryKey: ['vendor-search', params],
    queryFn: () => vendorsApi.search(params).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });
}

export function useVendorProfile(slug: string) {
  return useQuery({
    queryKey: ['vendor-profile', slug],
    queryFn: () => vendorsApi.getProfile(slug).then(r => r.data),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyVendorProfile() {
  return useQuery({
    queryKey: ['my-vendor-profile'],
    queryFn: () => vendorsApi.getMyProfile().then(r => r.data),
  });
}

// ─── BOOKINGS ────────────────────────────────────────
export function useMyBookings(params?: any) {
  return useQuery({
    queryKey: ['my-bookings', params],
    queryFn: () => bookingsApi.list(params).then(r => r.data),
  });
}

// ─── ATTENDEES ───────────────────────────────────────
export function useAttendees(eventId: string, params?: any) {
  return useQuery({
    queryKey: ['attendees', eventId, params],
    queryFn: () => attendeesApi.list(eventId, params).then(r => r.data),
    enabled: !!eventId,
  });
}

// ─── SPEAKERS ────────────────────────────────────────
export function useSpeakers(eventId: string) {
  return useQuery({
    queryKey: ['speakers', eventId],
    queryFn: () => speakersApi.list(eventId).then(r => r.data),
    enabled: !!eventId,
  });
}

// ─── ANALYTICS ───────────────────────────────────────
export function usePlannerOverview() {
  return useQuery({
    queryKey: ['planner-overview'],
    queryFn: () => analyticsApi.plannerOverview().then(r => r.data),
    refetchInterval: 30 * 1000,
  });
}

export function useEventAnalytics(eventId: string) {
  return useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => analyticsApi.eventStats(eventId).then(r => r.data),
    enabled: !!eventId,
  });
}

export function useLiveCheckIn(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['live-checkin', eventId],
    queryFn: () => analyticsApi.checkInLive(eventId).then(r => r.data),
    enabled: !!eventId && enabled,
    refetchInterval: 10 * 1000,
  });
}

export function useVendorRevenue() {
  return useQuery({
    queryKey: ['vendor-revenue'],
    queryFn: () => analyticsApi.vendorRevenue().then(r => r.data),
  });
}
