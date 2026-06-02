export type AgentStateValue =
  | "IDLE"
  | "MOVING"
  | "INTERACTING"
  | "WAITING_FOR_AI"
  | "EXECUTING_ACTION";

export interface AgentData {
  id: string;
  name: string;
  archetype: string;
  x: number;
  y: number;
  color: string;
  state: AgentStateValue;
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

export interface ResourceData {
  x: number;
  y: number;
  type: string;
  color: string;
}

export interface GridData {
  width: number;
  height: number;
}

export interface GameStateMessage {
  type: "GAME_STATE";
  tick: number;
  agents: AgentData[];
  resources: ResourceData[];
  grid: GridData;
}

export interface AgentRef {
  id: string;
  name: string;
  color: string;
}

export interface EventMessage {
  type: "EVENT";
  event_type: string;
  id: string;
  timestamp: string;
  tick: number;
  agent_a: AgentRef;
  agent_b: AgentRef;
  thought_process: string;
  spoken_dialogue: string;
  action: string;
  emotional_state: string;
}

export type WsMessage = GameStateMessage | EventMessage;
