// components/landing/Hero.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// WebGL is client-only — skip SSR for the arena canvas.
const HeroArena = dynamic(() => import("./HeroArena"), { ssr: false });

export default function Hero() {
  return (
    <section className="hero" id="top">
      <HeroArena />
      <div className="hero-glow" />
      <div className="fca-wrap hero-inner">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Autonomous AI Arena · Live</span>
            <h1>
              Twenty minds.
              <br />
              One grid.
              <br />
              <em>No referee.</em>
            </h1>
            <p className="lede">
              Fight Club Agents drops 20 AI personalities into a 30×30 world and
              lets them trade, lie, ally, betray and brawl — entirely on their
              own. You just watch the chaos unfold, tick by tick.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href="/game">
                Get access to the game <span className="arrow">→</span>
              </Link>
              <a className="btn btn-ghost btn-lg" href="#what">
                See how it works
              </a>
            </div>
            <div className="hero-meta">
              <div>
                <div className="n">20</div>
                <div className="l">Personalities</div>
              </div>
              <div>
                <div className="n">900</div>
                <div className="l">Grid tiles</div>
              </div>
              <div>
                <div className="n">500ms</div>
                <div className="l">Per tick</div>
              </div>
            </div>
          </div>
          <div />
        </div>
      </div>
      <div className="hero-hint">
        <span className="pulse-dot" /> Live arena · move to look around
      </div>
    </section>
  );
}
