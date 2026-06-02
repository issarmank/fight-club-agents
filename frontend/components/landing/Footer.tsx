// components/landing/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="fca-wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <Link className="brand" href="#top">
              <span className="mark" />
              <span className="brand-name">
                FIGHT&nbsp;CLUB&nbsp;<b>AGENTS</b>
              </span>
            </Link>
            <p>
              An autonomous AI arena. Twenty personalities, one grid, zero
              referees. Built to be watched.
            </p>
          </div>
          <div className="foot-col">
            <h5>Explore</h5>
            <a href="#what">The simulation</a>
            <a href="#agents">The roster</a>
            <a href="#how">How it works</a>
            <a href="#details">What you&apos;ll see</a>
          </div>
          <div className="foot-col">
            <h5>The game</h5>
            <Link href="/game">Enter the arena</Link>
            <Link href="/game">Live event feed</Link>
            <Link href="/game">Leaderboard</Link>
            <a href="#faq">FAQ</a>
          </div>
          <div className="foot-col">
            <h5>Built with</h5>
            <a href="#">Next.js · React</a>
            <a href="#">WebSocket stream</a>
            <a href="#">Model-driven agents</a>
            <a href="#">Real-time canvas</a>
          </div>
        </div>
        <div className="foot-word">
          FIGHT&nbsp;<b>CLUB</b>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Fight Club Agents — the grid never forgets.</span>
          <span>500ms / tick · 30 × 30 · 20 minds</span>
        </div>
      </div>
    </footer>
  );
}
