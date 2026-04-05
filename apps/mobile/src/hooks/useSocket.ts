import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'https://api.owambe.com';

let socketInstance: Socket | null = null;

async function getSocket(): Promise<Socket> {
  const token = await SecureStore.getItemAsync('accessToken');
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on('connect', () => console.log('[Socket] Connected'));
    socketInstance.on('disconnect', () => console.log('[Socket] Disconnected'));
    socketInstance.on('connect_error', (err) => console.warn('[Socket] Error:', err.message));
  }
  return socketInstance;
}

// ─── LIVE CHECK-IN HOOK ───────────────────────────────
export function useCheckInSocket(
  eventId: string,
  onUpdate: (data: { attendee: any; timestamp: string }) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const stableOnUpdate = useCallback(onUpdate, []);

  useEffect(() => {
    if (!eventId) return;

    let mounted = true;
    getSocket().then(socket => {
      if (!mounted) return;
      socketRef.current = socket;
      socket.emit('join:event', eventId);
      socket.on('checkin:update', stableOnUpdate);
    });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit('leave:event', eventId);
        socketRef.current.off('checkin:update', stableOnUpdate);
      }
    };
  }, [eventId, stableOnUpdate]);
}

// ─── NOTIFICATION SOCKET ─────────────────────────────
export function useNotificationSocket(
  onNotification: (notification: any) => void
) {
  const stableOnNotification = useCallback(onNotification, []);

  useEffect(() => {
    let mounted = true;
    getSocket().then(socket => {
      if (!mounted) return;
      socket.on('notification', stableOnNotification);
    });

    return () => {
      mounted = false;
      socketInstance?.off('notification', stableOnNotification);
    };
  }, [stableOnNotification]);
}

// ─── MESSAGE SOCKET ───────────────────────────────────
export function useMessageSocket(
  bookingId: string,
  onMessage: (message: any) => void
) {
  const stableOnMessage = useCallback(onMessage, []);

  useEffect(() => {
    if (!bookingId) return;
    let mounted = true;

    getSocket().then(socket => {
      if (!mounted) return;
      socket.emit('join:booking', bookingId);
      socket.on(`message:${bookingId}`, stableOnMessage);
    });

    return () => {
      mounted = false;
      socketInstance?.emit('leave:booking', bookingId);
      socketInstance?.off(`message:${bookingId}`, stableOnMessage);
    };
  }, [bookingId, stableOnMessage]);
}

export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
}
