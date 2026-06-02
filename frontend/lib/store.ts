import { create } from "zustand";
import type { GameStateMessage, EventMessage, AgentData } from "@/lib/types";

const MAX_EVENTS = 100;

interface GameStore {
  gameState: GameStateMessage | null;
  events: EventMessage[];
  selectedAgent: AgentData | null;
  connected: boolean;

  setGameState: (state: GameStateMessage) => void;
  addEvent: (event: EventMessage) => void;
  setSelectedAgent: (agent: AgentData | null) => void;
  setConnected: (v: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  events: [],
  selectedAgent: null,
  connected: false,

  setGameState: (state) =>
    set((prev) => {
      // Preserve selected agent reference with updated data
      const updatedSelected = state.agents.find(
        (a) => a.id === prev.selectedAgent?.id
      ) ?? null;
      return { gameState: state, selectedAgent: updatedSelected };
    }),

  addEvent: (event) =>
    set((prev) => ({
      events: [event, ...prev.events].slice(0, MAX_EVENTS),
    })),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setConnected: (connected) => set({ connected }),
}));
