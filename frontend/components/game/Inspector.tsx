// components/game/Inspector.tsx
"use client";

import { useGameStore } from "@/lib/useGameStore";
import { shortName } from "@/lib/agents";

function Bar({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div className="bar-row">
      <span className="lbl">{label}</span>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${Math.max(0, v)}%`, background: color }}
        />
      </div>
      <span className="val">{Math.max(0, Math.round(v))}</span>
    </div>
  );
}

export default function Inspector() {
  const a = useGameStore((s) =>
    s.selectedId ? s.agentsById[s.selectedId] : null
  );

  return (
    <div className="inspector">
      <div className="panel-head">
        <h3>Agent Inspector</h3>
      </div>
      {!a ? (
        <div className="insp-empty">
          Click any agent on the grid to inspect its{" "}
          <b>health, gold, alliances</b> and live memory log.
        </div>
      ) : (
        <div className="insp-body">
          <div className="insp-id">
            <span
              className="sw"
              style={{ background: a.color, color: a.color }}
            />
            <div>
              <div className="nm">
                {shortName(a.name)}
                {a.health <= 0 ? " ☠" : ""}
              </div>
              <div className="ar">{a.archetype.replace(/_/g, " ")}</div>
            </div>
          </div>
          <span className="emo-pill">● {a.emotional_state}</span>
          <div className="bars">
            <Bar
              label="Health"
              v={a.health}
              color={
                a.health > 50 ? "#2F8F5B" : a.health > 25 ? "#E8B23A" : "#DC143C"
              }
            />
            <Bar label="Energy" v={a.energy} color="#3A7BD5" />
          </div>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="v">{a.gold}</div>
              <div className="k">Gold</div>
            </div>
            <div className="stat-box">
              <div className="v">{a.kill_count}</div>
              <div className="k">Kills</div>
            </div>
            <div className="stat-box">
              <div className="v">{a.interaction_count}</div>
              <div className="k">Met</div>
            </div>
          </div>
          <div className="rel-row">
            <div className="rel">
              <div className="h">Allies</div>
              <div className="v ally">{a.ally_ids.length}</div>
            </div>
            <div className="rel">
              <div className="h">Enemies</div>
              <div className="v enemy">{a.enemy_ids.length}</div>
            </div>
          </div>
          <div className="mem-head">Recent memory</div>
          <div className="mem">
            {a.recent_memory.length ? (
              [...a.recent_memory].reverse().map((m, i) => (
                <div className="m" key={i}>
                  {m}
                </div>
              ))
            ) : (
              <div className="m" style={{ color: "var(--ink-faint)" }}>
                No encounters yet…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
