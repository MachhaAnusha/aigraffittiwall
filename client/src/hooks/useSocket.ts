import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getOrCreateDeviceId } from '../utils/deviceId';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '';

export type SocketRole = 'controller' | 'display' | 'admin';

export function useSocket(role: SocketRole, adminToken?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const deviceId = getOrCreateDeviceId();

  useEffect(() => {
    const query: Record<string, string> = { role };
    if (role === 'controller') {
      query.deviceId = deviceId;
    }

    const socket = io(SOCKET_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      query,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (role === 'controller') {
        socket.emit('register_device', { deviceId, timestamp: Date.now() });
      }
    });

    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [role, deviceId]);

  const emit = useCallback(
    (event: string, data: Record<string, unknown>) => {
      const payload = {
        ...data,
        deviceId,
        timestamp: Date.now(),
        ...(adminToken ? { adminToken } : {}),
      };
      socketRef.current?.emit(event, payload);
    },
    [deviceId, adminToken]
  );

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef, connected, deviceId, emit, on };
}
