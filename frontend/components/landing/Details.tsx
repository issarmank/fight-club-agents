// components/landing/Details.tsx
"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { PERSONALITIES, ACTION_META } from "@/lib/agents";
import type { ActionType } from "@/lib/types";

const DETAILS = [
  { n: "01", h: "The arena canvas", p: "Colored agent tokens with health bars and state glow — white when interacting, amber while thinking, red while acting. Resource gems dot the tiles." },
  { n: "02", h: "The agent inspector", p: "Click any agent to read its health, energy, gold, emotional state, kills, allies, enemies, and the rolling log of what it remembers." },
  { n: "03", h: "The live event feed", p: "A running ledger of who did what to whom — every line of dialogue and every action, color-coded by type, newest on top." },
  { n: "04", h: "The leaderboard", p: "Standings ranked by kills and hoarded gold. Watch a quiet merchant climb while the berserkers burn each other out." },
];

const actions = Object.keys(ACTION_META) as ActionType[];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

interface Line {
  id: number;
  a: string;
  aColor: string;
  b: string;
  bColor: string;
  verb: string;
  color: string;
}

let counter = 0;
function makeLine(): Line {
  let a = pick(PERSONALITIES);
  let b = pick(PERSONALITIES);
  while (b === a) b = pick(PERSONALITIES);
  const act = pick(actions);
  return {
    id: counter++,
    a: a.short,
    aColor: a.color,
    b: b.short,
    bColor: b.color,
    verb: ACTION_META[act].verb,
    color: ACTION_META[act].color,
  };
}

export default function Details() {
  const [lines, setLines] = useState<Line[]>([]);
  useEffect(() => {
    setLines(Array.from({ length: 7 }, makeLine));
    const t = setInterval(
      () => setLines((prev) => [makeLine(), ...prev].slice(0, 7)),
      1900
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section className="block" id="details">
      <div className="fca-wrap">
        <Reveal className="section-head">
          <span className="eyebrow">Under the hood</span>
          <h2>
            What you&apos;ll actually <em>see.</em>
          </h2>
        </Reveal>
        <div className="detail-grid">
          <Reveal className="detail-list">
            {DETAILS.map((d) => (
              <div className="detail-item" key={d.n}>
                <div className="di-n">{d.n}</div>
                <div>
                  <h4>{d.h}</h4>
                  <p>{d.p}</p>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal className="detail-visual">
            <div className="eyebrow" style={{ color: "var(--sand)" }}>
              Live feed · preview
            </div>
            <div className="mini-feed">
              {lines.map((l) => (
                <div className="ev" key={l.id}>
                  <span className="who" style={{ color: l.aColor }}>{l.a}</span>
                  <span className="act" style={{ color: l.color }}>{l.verb}</span>
                  <span className="who" style={{ color: l.bColor }}>{l.b}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
