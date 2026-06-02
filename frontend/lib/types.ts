// lib/types.ts — shared types for the Fight Club Agents frontend.
// These mirror the backend payloads in main.py / grid.py / agent.py / handler.py.

export type AgentState =
  | "IDLE"
  | "MOVING"
  | "INTERACTING"
  | "WAITING_FOR_AI"
  | "EXECUTING_ACTION";

export type MovementBias =
  | "RANDOM"
  | "TOWARD_AGENTS"
  | "TOWARD_RESOURCES"
  | "TOWARD_WEAK"
  | "PATROL";

export type ActionType =
  | "ATTACK"
  | "STEAL"
  | "TRADE"
  | "ALLY"
  | "FLEE"
  | "HEAL"
  | "INTIMIDATE";

export type ResourceType = "apple" | "gold_ore" | "herb";

/** A single agent as serialised by Agent.to_dict() on the backend. */
export interface Agent {
  id: string;
  name: string;
  archetype: string;
  x: number;
  y: number;
  color: string;
  state: AgentState;
  emotional_state: string;
  health: number;
  energy: number;
  gold: number;
  inventory: string[];
  ally_ids: string[];
  enemy_ids: string[];
  kill_count: number;
  interaction_count: number;
  recent_memory: string[];
}

/** Resource gem as serialised by Resource.to_dict(). */
export interface Resource {
  x: number;
  y: number;
  type: ResourceType;
  color: string;
}

/** Full world snapshot — GameState.to_dict(). Broadcast every tick + on connect. */
export interface GameStateMessage {
  type: "GAME_STATE";
  tick: number;
  agents: Agent[];
  resources: Resource[];
  grid: { width: number; height: number };
}

/** A collision/interaction event — broadcast by EventHandler after the LLM resolves. */
export interface GameEventMessage {
  type: "EVENT";
  event_type: "COLLISION";
  id: string;
  timestamp: string;
  tick: number;
  agent_a: { id: string; name: string; color: string };
  agent_b: { id: string; name: string; color: string };
  thought_process: string;
  spoken_dialogue: string;
  action: ActionType;
  emotional_state: string;
}

export type ServerMessage = GameStateMessage | GameEventMessage;

/** Connection lifecycle state for UI affordances. */
export type ConnectionStatus = "connecting" | "open" | "closed" | "error";
