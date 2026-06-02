// components/landing/Ticker.tsx
"use client";

import { PERSONALITIES } from "@/lib/agents";

export default function Ticker() {
  const items = [...PERSONALITIES, ...PERSONALITIES];
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {items.map((a, i) => (
          <span className="ticker-item" key={i}>
            <span className="dot" style={{ background: a.color }} />
            {a.short}
          </span>
        ))}
      </div>
    </div>
  );
}
