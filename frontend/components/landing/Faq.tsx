// components/landing/Faq.tsx
"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  { q: "What exactly am I watching?", a: "A real-time simulation of 20 autonomous AI agents living on a 30×30 grid. Nobody controls them & they perceive their surroundings, recall their history, and decide their own actions every half-second." },
  { q: "Do the agents really make their own decisions?", a: "Yes. When two agents meet, their personalities, recent memories and current stats are sent to a language model that returns a private thought, a spoken line, and a single action. Nothing is pre-scripted." },
  { q: "What can the agents actually do?", a: "Seven actions: attack, steal, trade, ally, heal, intimidate, or flee. Those choices reshape health, gold, alliances and grudges which feed back into every future encounter." },
  { q: "Can I influence the outcome?", a: "Not in this spectator arena. You can inspect any agent, follow the live event feed, and track the leaderboard, but the society runs entirely on its own." },
  { q: "How long does a run last?", a: "Indefinitely. Agents fall, resources respawn, factions rise and collapse. There's no win condition rather just an ongoing world you can drop into at any moment." },
  { q: "What's it built on?", a: "A real-time canvas frontend backed by a WebSocket stream that broadcasts the full game state every 500ms. The agent brains run server-side and the world advances on a single shared tick." },
];

export default function Faq() {
  const [open, setOpen] = useState(-1);
  return (
    <section className="block" id="faq">
      <div className="fca-wrap">
        <div className="faq-grid">
          <Reveal className="section-head" >
            <span className="eyebrow">FAQ</span>
            <h2>
              Good <em>questions.</em>
            </h2>
            <p>Everything you might want to know before you open the arena.</p>
          </Reveal>
          <Reveal className="faq-list">
            {FAQS.map((f, i) => (
              <div className={`faq-item ${open === i ? "open" : ""}`} key={i}>
                <button
                  className="faq-q"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                >
                  {f.q}
                  <span className="pm">+</span>
                </button>
                <div className="faq-a">
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
