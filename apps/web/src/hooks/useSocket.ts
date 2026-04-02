import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

let socketInstance: Socket | null = null;

function getSocket(token: string): Socket {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socketInstance;
}

// ─── GENERIC SOCKET HOOK ─────────────────────────────
export function useSocket() {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    socketRef.current = getSocket(accessToken);
    return () => {
      // Don't disconnect on unmount — socket is shared
    };
  }, [accessToken]);

  return socketRef.current;
}

// ─── REAL-TIME CHECK-IN HOOK ─────────────────────────
interface CheckInUpdate {
  attendee: {
    firstName: string;
    lastName: string;
    ticketType: { name: string };
  };
  timestamp: string;
}

export function useCheckInSocket(
  eventId: string,
  onUpdate: (update: CheckInUpdate) => void
) {
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const stableOnUpdate = useCallback(onUpdate, []);

  useEffect(() => {
    if (!accessToken || !eventId) return;

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    socket.emit('join:event', eventId);
    socket.on('checkin:update', stableOnUpdate);

    return () => {
      socket.emit('leave:event', eventId);
      socket.off('checkin:update', stableOnUpdate);
    };
  }, [accessToken, eventId, stableOnUpdate]);
}

// ─── NOTIFICATIONS HOOK ───────────────────────────────
export function useNotificationSocket(
  onNotification: (n: any) => void
) {
  const { accessToken } = useAuthStore();
  const stableOnNotification = useCallback(onNotification, []);

  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket(accessToken);
    socket.on('notification', stableOnNotification);

    return () => {
      socket.off('notification', stableOnNotification);
    };
  }, [accessToken, stableOnNotification]);
}

// ─── DISCONNECT ──────────────────────────────────────
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
