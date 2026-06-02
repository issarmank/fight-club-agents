// components/landing/Nav.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="fca-wrap nav-inner">
        <Link className="brand" href="#top">
          <span className="mark" />
          <span className="brand-name">
            FIGHT&nbsp;CLUB&nbsp;<b>AGENTS</b>
          </span>
        </Link>
        <nav className="nav-links">
          <a href="#what" className="hide-sm">The Sim</a>
          <a href="#agents" className="hide-sm">Agents</a>
          <a href="#how" className="hide-sm">How it works</a>
          <a href="#faq" className="hide-sm">FAQ</a>
          <Link className="btn btn-primary" href="/game">
            Get access to the game <span className="arrow">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
