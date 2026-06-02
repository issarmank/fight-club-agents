"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store";
import type { EventMessage } from "@/lib/types";

const ACTION_COLORS: Record<string, string> = {
  ATTACK: "text-red-400",
  STEAL: "text-orange-400",
  ALLY: "text-green-400",
  TRADE: "text-blue-400",
  FLEE: "text-yellow-400",
  HEAL: "text-emerald-300",
  INTIMIDATE: "text-purple-400",
  NEGOTIATE: "text-cyan-400",
  IGNORE: "text-gray-500",
};

function EventCard({ event }: { event: EventMessage }) {
  const actionClass = ACTION_COLORS[event.action] ?? "text-gray-400";
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="border-b border-border-dim py-2 px-3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-600 text-xs font-mono">#{event.tick}</span>
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: event.agent_a.color }}
        />
        <span className="text-white text-xs font-semibold truncate">
          {event.agent_a.name}
        </span>
        <span className={`text-xs font-bold uppercase font-mono ${actionClass}`}>
          {event.action}
        </span>
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: event.agent_b.color }}
        />
        <span className="text-white text-xs font-semibold truncate">
          {event.agent_b.name}
        </span>
        <span className="text-gray-600 text-xs ml-auto flex-shrink-0">{time}</span>
      </div>

      {event.spoken_dialogue && (
        <p className="text-gray-300 text-xs italic pl-2 border-l-2 border-gray-700">
          &ldquo;{event.spoken_dialogue}&rdquo;
        </p>
      )}

      <div className="flex gap-2 mt-1">
        <span className="text-gray-500 text-xs">
          feeling:{" "}
          <span className="text-gray-400">{event.emotional_state}</span>
        </span>
      </div>
    </div>
  );
}

export default function EventLog() {
  const events = useGameStore((s) => s.events);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Don't auto-scroll — let user read at their own pace
  // But do scroll to top (newest) when new event arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border-dim flex items-center justify-between">
        <h2 className="text-gray-300 text-sm font-semibold uppercase tracking-widest">
          Live Feed
        </h2>
        <span className="text-gray-600 text-xs font-mono">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-600 text-xs font-mono">
            Waiting for first encounter...
          </div>
        ) : (
          <>
            <div ref={bottomRef} />
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
