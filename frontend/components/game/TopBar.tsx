// components/game/TopBar.tsx
"use client";

import Link from "next/link";
import { useGameStore } from "@/lib/useGameStore";

export default function TopBar() {
  const status = useGameStore((s) => s.status);
  const tick = useGameStore((s) => s.tick);
  const alive = useGameStore((s) => s.agents.filter((a) => a.health > 0).length);
  const total = useGameStore((s) => s.agents.length);
  const online = status === "open";

  return (
    <div className="topbar">
      <div className="tb-left">
        <Link className="back" href="/">
          <span className="mark" />
          FIGHT&nbsp;CLUB&nbsp;<b>AGENTS</b>
        </Link>
        <span className="divider" />
        <span className={`live ${online ? "" : "offline"}`}>
          <span className="ld" />
          {online
            ? "Live Arena"
            : status === "connecting"
            ? "Connecting…"
            : "Offline"}
        </span>
      </div>
      <div className="tb-right">
        <span className="tick-read">
          TICK&nbsp; <b>{tick}</b>
        </span>
        <span className="tick-read">
          {total ? `${alive} / ${total} alive` : "—"}
        </span>
      </div>
    </div>
  );
}
