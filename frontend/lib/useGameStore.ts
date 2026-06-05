// lib/useGameStore.ts — Zustand store backed by a live WebSocket to the backend.
//
// Connects to NEXT_PUBLIC_WS_URL (default ws://localhost:8000/ws). The backend
// sends a GAME_STATE snapshot on connect, then a GAME_STATE every 0.5s tick, plus
// async EVENT messages on each interaction. We keep the latest snapshot and a
// rolling buffer of events. Auto-reconnects with backoff; pings to stay alive.

"use client";

import { create } from "zustand";
import { useEffect } from "react";
import type {
  Agent,
  Resource,
  GameEventMessage,
  RespawnMessage,
  RoundOverMessage,
  ServerMessage,
  ConnectionStatus,
} from "./types";

const DEFAULT_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
const MAX_EVENTS = 120;

interface GameStore {
  status: ConnectionStatus;
  tick: number;
  agents: Agent[];
  agentsById: Record<string, Agent>;
  resources: Resource[];
  grid: { width: number; height: number };
  events: GameEventMessage[]; // newest first
  respawnEvents: RespawnMessage[]; // newest first
  roundOvers: RoundOverMessage[]; // newest first
  selectedId: string | null;
  /** Bumped on every GAME_STATE or GAME_DELTA so non-React render loops can detect new frames. */
  frame: number;

  select: (id: string | null) => void;
  ingest: (msg: ServerMessage) => void;
  setStatus: (s: ConnectionStatus) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  status: "connecting",
  tick: 0,
  agents: [],
  agentsById: {},
  resources: [],
  grid: { width: 30, height: 30 },
  events: [],
  respawnEvents: [],
  roundOvers: [],
  selectedId: null,
  frame: 0,

  select: (id) => set({ selectedId: id }),
  setStatus: (status) => set({ status }),
  reset: () =>
    set({
      tick: 0,
      agents: [],
      agentsById: {},
      resources: [],
      events: [],
      respawnEvents: [],
      roundOvers: [],
    }),

  ingest: (msg) =>
    set((state) => {
      if (msg.type === "GAME_STATE") {
        // Full snapshot — replace everything (on-connect only)
        const agentsById: Record<string, Agent> = {};
        for (const a of msg.agents) agentsById[a.id] = a;
        return {
          tick: msg.tick,
          agents: msg.agents,
          agentsById,
          resources: msg.resources,
          grid: msg.grid,
          frame: state.frame + 1,
        };
      }

      if (msg.type === "GAME_DELTA") {
        // Merge delta fields into the existing agentsById map
        const agentsById = { ...state.agentsById };
        for (const delta of msg.agents) {
          const existing = agentsById[delta.id];
          if (existing) {
            agentsById[delta.id] = { ...existing, ...delta };
          }
        }
        const agents = state.agents.map((a) => agentsById[a.id] ?? a);
        return {
          tick: msg.tick,
          agents,
          agentsById,
          resources: msg.resources,
          frame: state.frame + 1,
        };
      }

      if (msg.type === "RESPAWN") {
        return {
          respawnEvents: [msg, ...state.respawnEvents].slice(0, MAX_EVENTS),
        };
      }

      if (msg.type === "ROUND_OVER") {
        return {
          roundOvers: [msg, ...state.roundOvers].slice(0, MAX_EVENTS),
        };
      }

      // EVENT (COLLISION) — deduplicate by id to guard against double-delivery
      if (state.events.some((ev) => ev.id === (msg as GameEventMessage).id)) {
        return state;
      }
      return { events: [msg as GameEventMessage, ...state.events].slice(0, MAX_EVENTS) };
    }),
}));

// ---- Connection manager (module singleton, survives StrictMode remounts) ----

let socket: WebSocket | null = null;
let refCount = 0;
let retry = 0;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let closedByUs = false;

function open(url: string) {
  const { setStatus, ingest } = useGameStore.getState();
  closedByUs = false;
  setStatus(retry === 0 ? "connecting" : "connecting");

  const ws = new WebSocket(url);
  socket = ws;

  ws.onopen = () => {
    retry = 0;
    useGameStore.getState().setStatus("open");
    pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 20000);
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data) as ServerMessage;
      ingest(msg);
    } catch {
      /* ignore malformed frames */
    }
  };

  ws.onerror = () => useGameStore.getState().setStatus("error");

  ws.onclose = () => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
    socket = null;
    if (closedByUs || refCount === 0) {
      useGameStore.getState().setStatus("closed");
      return;
    }
    // backoff: 0.5s, 1s, 2s, 4s … capped at 8s
    const delay = Math.min(8000, 500 * 2 ** retry);
    retry += 1;
    useGameStore.getState().setStatus("connecting");
    reconnectTimer = setTimeout(() => open(url), delay);
  };
}

/** React hook: connect while any component using it is mounted. */
export function useGameSocket(url: string = DEFAULT_URL) {
  useEffect(() => {
    refCount += 1;
    if (!socket) open(url);

    return () => {
      refCount -= 1;
      if (refCount === 0) {
        closedByUs = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (pingTimer) clearInterval(pingTimer);
        socket?.close();
        socket = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return useGameStore((s) => s.status);
}
