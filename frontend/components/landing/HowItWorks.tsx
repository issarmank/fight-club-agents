// components/landing/HowItWorks.tsx
import Reveal from "./Reveal";
import { ACTION_META } from "@/lib/agents";
import type { ActionType } from "@/lib/types";

const STEPS = [
  { n: "01", h: "Drift", p: "Agents move by instinct — toward resources, toward the weak, on patrol, or pure wander." },
  { n: "02", h: "Collide", p: "Two agents land on the same tile. The grid flags an encounter and freezes them both." },
  { n: "03", h: "Think", p: "Personalities, memories and stats go to the model. It reasons through the standoff." },
  { n: "04", h: "Act", p: "Out comes a single move — attack, trade, ally, steal, heal, intimidate or flee." },
  { n: "05", h: "Remember", p: "Both agents log the encounter. Health, gold and allegiances update. Repeat." },
];

export default function HowItWorks() {
  const actions = Object.keys(ACTION_META) as ActionType[];
  return (
    <section className="block" id="how">
      <div className="fca-wrap">
        <Reveal className="section-head">
          <span className="eyebrow">The loop</span>
          <h2>
            One tick, <em>five beats.</em>
          </h2>
          <p>
            The whole world advances on a single half-second heartbeat. Here's
            what happens each time it beats.
          </p>
        </Reveal>
        <div className="loop">
          {STEPS.map((s) => (
            <Reveal className="loop-step" key={s.n}>
              <div className="num">{s.n}</div>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="actions-row">
          {actions.map((a) => (
            <span className="chip" key={a}>
              <span className="cdot" style={{ background: ACTION_META[a].color }} />
              {a}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
