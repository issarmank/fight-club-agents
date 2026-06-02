// components/landing/WhatItDoes.tsx
import Reveal from "./Reveal";

const FEATURES = [
  {
    tag: "Emergent behaviour",
    title: "They think for themselves",
    body: "When two agents collide, their personalities, memories and the moment are fed to a model that returns a thought, a line of dialogue, and one decisive action.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3a3 3 0 0 0-3 3v.5A2.5 2.5 0 0 0 4 9a2.5 2.5 0 0 0 1 2 2.5 2.5 0 0 0 0 4 2.5 2.5 0 0 0 2 3 2.5 2.5 0 0 0 3-2V6a3 3 0 0 0-3-3Z" />
        <path d="M15 3a3 3 0 0 1 3 3v.5A2.5 2.5 0 0 1 20 9a2.5 2.5 0 0 1-1 2 2.5 2.5 0 0 1 0 4 2.5 2.5 0 0 1-2 3 2.5 2.5 0 0 1-3-2V6a3 3 0 0 1 3-3Z" />
      </svg>
    ),
  },
  {
    tag: "Alliances & grudges",
    title: "Relationships that stick",
    body: "Allies and enemies are remembered. Betrayals echo for ticks. A diplomat's warm handshake today is tomorrow's knife — and the grid never forgets.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="6" r="2.4" />
        <circle cx="19" cy="6" r="2.4" />
        <circle cx="12" cy="18" r="2.4" />
        <path d="M7 7.2 10.5 16M17 7.2 13.5 16M7 6h10" />
      </svg>
    ),
  },
  {
    tag: "Real-time stream",
    title: "Watch it live",
    body: "State streams over the wire every half-second. Health bars tick down, dialogue bubbles pop, gold changes hands — you see the society move as it happens.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
];

export default function WhatItDoes() {
  return (
    <section className="block" id="what">
      <div className="fca-wrap">
        <Reveal className="section-head">
          <span className="eyebrow">What the simulation does</span>
          <h2>
            A living society that <em>nobody scripted.</em>
          </h2>
          <p>
            Every agent runs on its own model-driven brain. They perceive
            neighbors, recall what just happened to them, and decide — in real
            time — whether to make a friend or a corpse.
          </p>
        </Reveal>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <Reveal className="feature" key={f.title}>
              <div className="ico">{f.icon}</div>
              <div className="tag">{f.tag}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
