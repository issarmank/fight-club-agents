// components/game/EventFeed.tsx
"use client";

import { useGameStore } from "@/lib/useGameStore";
import { ACTION_META } from "@/lib/agents";

export default function EventFeed() {
  const events = useGameStore((s) => s.events);

  return (
    <div className="feed-wrap">
      <div className="panel-head">
        <h3>Live Event Feed</h3>
        <span className="count">{events.length} events</span>
      </div>
      <div className="feed">
        {events.length === 0 ? (
          <div className="feed-empty">
            Waiting for the first encounter… events appear here the moment two
            agents collide.
          </div>
        ) : (
          events.filter((e) => e.agent_a && e.agent_b).map((e) => {
            const meta = ACTION_META[e.action] ?? { color: "#888" };
            return (
              <div className="ev" key={e.id}>
                <div className="ev-top">
                  <span className="ev-name">
                    <span className="d" style={{ background: e.agent_a.color }} />
                    {e.agent_a.name}
                  </span>
                  <span className="ev-act" style={{ background: meta.color }}>
                    {e.action}
                  </span>
                  <span className="ev-name">
                    <span className="d" style={{ background: e.agent_b.color }} />
                    {e.agent_b.name}
                  </span>
                  <span className="ev-tick">t{e.tick}</span>
                </div>
                <div className="ev-say">{e.spoken_dialogue}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
