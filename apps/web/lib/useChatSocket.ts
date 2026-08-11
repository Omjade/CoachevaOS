import { useEffect, useRef, useState } from "react";
import { API_URL, MessageData } from "@/lib/api";

export type SocketState = "connecting" | "open" | "closed";

interface PresenceEvent {
  event: "presence";
  user_id: string;
  online: boolean;
  last_seen_at?: string;
}

interface TypingEvent {
  event: "typing";
  thread_id: string;
  user_id: string;
}

export function useChatSocket({
  onMessage,
  onPresence,
  onTyping,
  onReconnect,
}: {
  onMessage: (message: MessageData) => void;
  onPresence?: (event: PresenceEvent) => void;
  onTyping?: (event: TypingEvent) => void;
  onReconnect?: () => void;
}) {
  const [state, setState] = useState<SocketState>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const hasConnectedOnceRef = useRef(false);
  const callbacksRef = useRef({ onMessage, onPresence, onTyping, onReconnect });
  callbacksRef.current = { onMessage, onPresence, onTyping, onReconnect };

  useEffect(() => {
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      if (cancelled) return;
      setState("connecting");
      const wsUrl = API_URL.replace(/^http/, "ws") + "/ws";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState("open");
        if (hasConnectedOnceRef.current) {
          callbacksRef.current.onReconnect?.();
        }
        hasConnectedOnceRef.current = true;
        attemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "message") {
            callbacksRef.current.onMessage(data.message as MessageData);
          } else if (data.event === "presence") {
            callbacksRef.current.onPresence?.(data as PresenceEvent);
          } else if (data.event === "typing") {
            callbacksRef.current.onTyping?.(data as TypingEvent);
          }
        } catch {
          // ignore malformed payloads
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setState("closed");
        const delay = Math.min(10000, 500 * 2 ** attemptRef.current);
        attemptRef.current += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  function send(payload: object) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  return { state, send };
}
