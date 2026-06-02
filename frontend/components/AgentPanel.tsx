"use client";

import { useGameStore } from "@/lib/store";

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  IDLE: { label: "Idle", color: "text-gray-400" },
  MOVING: { label: "Moving", color: "text-blue-400" },
  INTERACTING: { label: "Interacting", color: "text-yellow-400" },
  WAITING_FOR_AI: { label: "Thinking...", color: "text-cyan-400" },
  EXECUTING_ACTION: { label: "Acting", color: "text-red-400" },
};

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-300 font-mono">{Math.max(0, Math.round(value))}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function AgentPanel() {
  const { selectedAgent, gameState } = useGameStore();

  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-xs font-mono px-4 text-center">
        Click an agent on the map to inspect them
      </div>
    );
  }

  const allyNames = (gameState?.agents ?? [])
    .filter((a) => selectedAgent.ally_ids.includes(a.id))
    .map((a) => a.name);

  const enemyNames = (gameState?.agents ?? [])
    .filter((a) => selectedAgent.enemy_ids.includes(a.id))
    .map((a) => a.name);

  const stateInfo = STATE_LABELS[selectedAgent.state] ?? {
    label: selectedAgent.state,
    color: "text-gray-400",
  };

  return (
    <div className="p-3 overflow-y-auto h-full text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: selectedAgent.color }}
        />
        <div>
          <p className="text-white font-semibold">{selectedAgent.name}</p>
          <p className="text-gray-500">{selectedAgent.archetype.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* State + emotion */}
      <div className="flex gap-3 mb-3">
        <span className={`font-mono ${stateInfo.color}`}>{stateInfo.label}</span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-400 italic">{selectedAgent.emotional_state}</span>
      </div>

      {/* Stats */}
      <StatBar label="Health" value={selectedAgent.health} color="bg-red-500" />
      <StatBar label="Energy" value={selectedAgent.energy} color="bg-blue-500" />

      {/* Gold & position */}
      <div className="flex gap-4 my-3 text-gray-400">
        <span>
          <span className="text-yellow-400">⬡</span> {selectedAgent.gold} gold
        </span>
        <span>
          ({selectedAgent.x}, {selectedAgent.y})
        </span>
      </div>

      {/* Kills / interactions */}
      <div className="flex gap-4 mb-3 text-gray-500">
        <span>
          <span className="text-red-400">{selectedAgent.kill_count}</span> kills
        </span>
        <span>
          <span className="text-cyan-400">{selectedAgent.interaction_count}</span> encounters
        </span>
      </div>

      {/* Inventory */}
      {selectedAgent.inventory.length > 0 && (
        <div className="mb-3">
          <p className="text-gray-500 mb-1">Inventory</p>
          <div className="flex flex-wrap gap-1">
            {selectedAgent.inventory.slice(-8).map((item, i) => (
              <span
                key={i}
                className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Allies */}
      {allyNames.length > 0 && (
        <div className="mb-3">
          <p className="text-green-600 mb-1">Allies</p>
          {allyNames.map((n) => (
            <p key={n} className="text-green-400">
              {n}
            </p>
          ))}
        </div>
      )}

      {/* Enemies */}
      {enemyNames.length > 0 && (
        <div className="mb-3">
          <p className="text-red-600 mb-1">Enemies</p>
          {enemyNames.map((n) => (
            <p key={n} className="text-red-400">
              {n}
            </p>
          ))}
        </div>
      )}

      {/* Recent memory */}
      {selectedAgent.recent_memory.length > 0 && (
        <div>
          <p className="text-gray-500 mb-1">Recent Memory</p>
          <div className="space-y-0.5">
            {selectedAgent.recent_memory.map((m, i) => (
              <p key={i} className="text-gray-500 italic">
                · {m}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
