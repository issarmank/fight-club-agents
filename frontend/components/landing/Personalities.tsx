// components/landing/Personalities.tsx
import Reveal from "./Reveal";
import { PERSONALITIES } from "@/lib/agents";

export default function Personalities() {
  return (
    <section className="block" id="agents">
      <div className="persona-band">
        <div className="fca-wrap">
            <Reveal className="section-head">
              <span className="eyebrow">The roster</span>
              <h2>
                Meet the <em>twenty.</em>
              </h2>
              <p>
                Each agent is a hand-written personality with its own goals,
                movement instincts and emotional baseline. Drop them together
                and watch the factions form.
              </p>
            </Reveal>
            <div className="persona-grid">
              {PERSONALITIES.map((a) => (
                <div className="persona" key={a.archetype}>
                  <div className="persona-top">
                    <span
                      className="swatch"
                      style={{ background: a.color, color: a.color }}
                    />
                    <div>
                      <div className="name">{a.short}</div>
                      <div className="emo">{a.emo}</div>
                    </div>
                  </div>
                  <div className="desc">{a.tagline}</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </section>
  );
}
