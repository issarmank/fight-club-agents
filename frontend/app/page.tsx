"use client";

import dynamic from "next/dynamic";
import { useGameStore } from "@/lib/store";
import { useGameSocket } from "@/lib/useGameSocket";
import EventLog from "@/components/EventLog";
import AgentPanel from "@/components/AgentPanel";

// Lazy-load canvas (Konva needs browser env)
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center bg-[#0d0d16] border border-[#2a2a3a] rounded"
      style={{ width: 600, height: 600 }}
    >
      <span className="text-gray-500 text-sm animate-pulse">Loading canvas...</span>
    </div>
  ),
});

function StatusBar() {
  const { gameState, connected, events } = useGameStore();
  const alive = gameState?.agents.filter((a) => a.health > 0).length ?? 0;
  const interacting =
    gameState?.agents.filter((a) => a.state === "INTERACTING" || a.state === "WAITING_FOR_AI")
      .length ?? 0;

  return (
    <div className="flex items-center gap-6 px-4 py-2 border-b border-[#2a2a3a] text-xs font-mono">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
        />
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "LIVE" : "RECONNECTING"}
        </span>
      </div>
      <span className="text-gray-500">
        Tick <span className="text-gray-300">{gameState?.tick ?? 0}</span>
      </span>
      <span className="text-gray-500">
        Agents alive <span className="text-gray-300">{alive}</span>
        <span className="text-gray-700">/20</span>
      </span>
      <span className="text-gray-500">
        Interacting <span className="text-yellow-400">{interacting}</span>
      </span>
      <span className="text-gray-500">
        Events <span className="text-gray-300">{events.length}</span>
      </span>
    </div>
  );
}

export default function Home() {
  useGameSocket();

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
        <div>
          <h1 className="text-white font-semibold tracking-wider uppercase text-sm">
            ⚔ Fight Club Agents
          </h1>
          <p className="text-gray-600 text-xs">Autonomous AI ecosystem sandbox</p>
        </div>
      </header>

      {/* Status bar */}
      <StatusBar />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas — center */}
        <main className="flex-1 flex items-start justify-center p-4 overflow-auto">
          <GameCanvas />
        </main>

        {/* Right sidebar: event log + agent inspector */}
        <aside className="w-80 border-l border-[#2a2a3a] flex flex-col overflow-hidden">
          {/* Agent Inspector — top half */}
          <div className="h-72 border-b border-[#2a2a3a] overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-[#2a2a3a]">
              <h2 className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
                Agent Inspector
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <AgentPanel />
            </div>
          </div>

          {/* Event Log — bottom half */}
          <div className="flex-1 overflow-hidden">
            <EventLog />
          </div>
        </aside>
      </div>
    </div>
  );
}
