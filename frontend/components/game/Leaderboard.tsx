// components/game/Leaderboard.tsx
"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { shortName } from "@/lib/agents";

type Key = "kills" | "gold" | "health";

export default function Leaderboard() {
  const [key, setKey] = useState<Key>("kills");
  const agents = useGameStore((s) => s.agents);
  const selectedId = useGameStore((s) => s.selectedId);
  const select = useGameStore((s) => s.select);

  const sorted = useMemo(() => {
    const arr = [...agents];
    arr.sort((x, y) => {
      if (key === "kills")
        return y.kill_count - x.kill_count || y.gold - x.gold;
      if (key === "gold") return y.gold - x.gold;
      return Math.max(0, y.health) - Math.max(0, x.health);
    });
    return arr;
  }, [agents, key]);

  const tabs: Key[] = ["kills", "gold", "health"];

  return (
    <div className="col col-right">
      <div className="panel-head">
        <h3>Leaderboard</h3>
      </div>
      <div className="lb-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`lb-tab ${key === t ? "active" : ""}`}
            onClick={() => setKey(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="lb-list">
        {sorted.map((a, i) => {
          const val =
            key === "kills" ? (
              <>
                {a.kill_count} <small>k</small>
              </>
            ) : key === "gold" ? (
              <>
                {a.gold} <small>g</small>
              </>
            ) : (
              <>
                {Math.max(0, a.health)} <small>hp</small>
              </>
            );
          return (
            <button
              key={a.id}
              className={`lb-row ${i === 0 ? "top1" : ""} ${
                a.health <= 0 ? "dead" : ""
              } ${selectedId === a.id ? "selected" : ""}`}
              onClick={() => select(a.id)}
            >
              <span className="lb-rank">{i + 1}</span>
              <span className="lb-id">
                <span className="d" style={{ background: a.color }} />
                <span className="n">
                  {shortName(a.name)}
                  {a.health <= 0 ? " ☠" : ""}
                </span>
              </span>
              <span
                className="lb-val"
                style={{ color: i === 0 ? "var(--orange)" : "var(--ink)" }}
              >
                {val}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
