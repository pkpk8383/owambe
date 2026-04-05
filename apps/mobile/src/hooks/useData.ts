import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  eventsApi, vendorsApi, bookingsApi,
  analyticsApi, attendeesApi, aiApi,
} from '../services/api';

// ─── EVENTS ──────────────────────────────────────────
export function useMyEvents(params?: any) {
  return useQuery({
    queryKey: ['my-events', params],
    queryFn: () => eventsApi.list(params).then(r => r.data),
    staleTime: 60_000,
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
    staleTime: 5 * 60_000,
  });
}

// ─── VENDORS ─────────────────────────────────────────
export function useVendorSearch(params?: any) {
  return useQuery({
    queryKey: ['vendor-search', params],
    queryFn: () => vendorsApi.search(params).then(r => r.data),
    staleTime: 2 * 60_000,
    enabled: !!params,
  });
}

export function useVendorProfile(slug: string) {
  return useQuery({
    queryKey: ['vendor-profile', slug],
    queryFn: () => vendorsApi.getProfile(slug).then(r => r.data),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}

export function useMyVendorProfile() {
  return useQuery({
    queryKey: ['my-vendor-profile'],
    queryFn: () => vendorsApi.getMyProfile().then(r => r.data),
    staleTime: 30_000,
  });
}

// ─── BOOKINGS ────────────────────────────────────────
export function useMyBookings(params?: any) {
  return useQuery({
    queryKey: ['my-bookings', params],
    queryFn: () => bookingsApi.list(params).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useBookingMessages(bookingId: string) {
  return useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => bookingsApi.getMessages(bookingId).then(r => r.data),
    enabled: !!bookingId,
    refetchInterval: 5_000,
  });
}

export function useSendMessage(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => bookingsApi.sendMessage(bookingId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', bookingId] }),
  });
}

// ─── ANALYTICS ───────────────────────────────────────
export function usePlannerOverview() {
  return useQuery({
    queryKey: ['planner-overview'],
    queryFn: () => analyticsApi.plannerOverview().then(r => r.data),
    refetchInterval: 30_000,
  });
}

export function useLiveCheckIn(eventId: string, enabled = true) {
  return useQuery({
    queryKey: ['live-checkin', eventId],
    queryFn: () => analyticsApi.checkInLive(eventId).then(r => r.data),
    enabled: !!eventId && enabled,
    refetchInterval: 10_000,
  });
}

export function useVendorRevenue() {
  return useQuery({
    queryKey: ['vendor-revenue'],
    queryFn: () => analyticsApi.vendorRevenue().then(r => r.data),
    staleTime: 60_000,
  });
}

// ─── ATTENDEES ───────────────────────────────────────
export function useTicket(qrCode: string) {
  return useQuery({
    queryKey: ['ticket', qrCode],
    queryFn: () => attendeesApi.getTicket(qrCode).then(r => r.data),
    enabled: !!qrCode,
    staleTime: 5 * 60_000,
  });
}

// ─── CHECK-IN ────────────────────────────────────────
export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { qrCode: string; eventId: string }) => attendeesApi.checkIn(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['live-checkin', variables.eventId] });
    },
  });
}
