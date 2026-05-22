import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/authStore';

export function useWebSocket() {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('mk_token') : null;
    if (!user || !token) return;

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
        // Subscribe to household specific topic
        if (user.householdId) {
          client.subscribe(`/topic/household/${user.householdId}`, (message) => {
            if (message.body) {
              const eventData = JSON.parse(message.body);
              console.log('Received websocket event: ', eventData);
              // We could dispatch a global event here or use a Zustand store to hold recent events
              window.dispatchEvent(new CustomEvent('mk_ws_event', { detail: eventData }));
            }
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [user]);

  return { stompClient, isConnected };
}
