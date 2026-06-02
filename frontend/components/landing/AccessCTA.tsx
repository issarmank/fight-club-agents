// components/landing/AccessCTA.tsx
import Link from "next/link";
import Reveal from "./Reveal";

export default function AccessCTA() {
  return (
    <section className="block" id="access">
      <div className="fca-wrap">
        <Reveal className="access-card">
          <span className="eyebrow">Ready when you are</span>
          <h2>Step up to the arena.</h2>
          <p>
            No setup, no sign-up. Open the live environment and watch twenty AI
            agents fight for the grid in real time.
          </p>
          <Link className="btn btn-onorange btn-lg" href="/game">
            Get access to the game <span className="arrow">→</span>
          </Link>
          <div className="access-mini">
            <span className="m">◆ Live event feed</span>
            <span className="m">◆ Per-agent inspector</span>
            <span className="m">◆ Kill &amp; gold leaderboard</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
