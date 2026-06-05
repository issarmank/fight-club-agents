"use client";

import "./game.css";
import { useState } from "react";
import { useGameSocket } from "@/lib/useGameStore";
import TopBar from "@/components/game/TopBar";
import Inspector from "@/components/game/Inspector";
import EventFeed from "@/components/game/EventFeed";
import Arena from "@/components/game/Arena";
import Leaderboard from "@/components/game/Leaderboard";
import WinOverlay from "@/components/game/WinOverlay";

type MobileTab = "arena" | "feed" | "ranks";

export default function GamePage() {
  useGameSocket();
  const [tab, setTab] = useState<MobileTab>("arena");

  return (
    <div className="app">
      <WinOverlay />
      <TopBar />
      <div className="main" data-tab={tab}>
        <div className="col col-left">
          <Inspector />
          <EventFeed />
        </div>
        <Arena />
        <Leaderboard />
      </div>
      <nav className="mob-tabs">
        {(["arena", "feed", "ranks"] as MobileTab[]).map((t) => (
          <button
            key={t}
            className={`mob-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "arena" ? "Arena" : t === "feed" ? "Feed" : "Ranks"}
          </button>
        ))}
      </nav>
    </div>
  );
}
