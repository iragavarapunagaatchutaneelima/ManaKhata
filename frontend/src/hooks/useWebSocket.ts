import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/authStore';

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  // Only reconnect when userId changes (not on every user object update)
  const userId = user?.userId;
  const householdId = user?.householdId;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mk_token') : null;
    if (!userId || !token) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        if (householdId) {
          client.subscribe(`/topic/household/${householdId}`, (message) => {
            if (message.body) {
              try {
                const eventData = JSON.parse(message.body);
                window.dispatchEvent(new CustomEvent('mk_ws_event', { detail: eventData }));
              } catch {
                // Ignore malformed messages
              }
            }
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.warn('[WS] STOMP error:', frame.headers?.message);
        setIsConnected(false);
      },
      onWebSocketError: () => {
        // Silently handle — reconnectDelay will retry
        setIsConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      setIsConnected(false);
      client.deactivate().catch(() => {
        // Ignore deactivation errors on cleanup
      });
      clientRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, householdId]);

  return { isConnected };
}
