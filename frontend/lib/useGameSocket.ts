"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store";
import type { WsMessage } from "@/lib/types";

const WS_URL = "ws://localhost:8000/ws";
const RECONNECT_DELAY = 2000;

export function useGameSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setGameState, addEvent, setConnected } = useGameStore();

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (e: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(e.data) as WsMessage;
          if (msg.type === "GAME_STATE") {
            setGameState(msg);
          } else if (msg.type === "EVENT") {
            addEvent(msg);
          }
        } catch {
          // malformed message — ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [setGameState, addEvent, setConnected]);
}
