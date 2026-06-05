"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/useGameStore";

export default function WinOverlay() {
  const router = useRouter();
  const gameOver = useGameStore((s) => s.gameOver);
  const restart = useGameStore((s) => s.restart);

  if (!gameOver) return null;

  const handleRestart = async () => {
    await restart();
  };

  return (
    <div className="win-overlay">
      <div className="win-card">
        <p className="win-label">Last Agent Standing</p>
        <div className="win-agent">
          <span className="win-dot" style={{ background: gameOver.color }} />
          <h1 className="win-name">{gameOver.name}</h1>
        </div>
        <p className="win-archetype">{gameOver.archetype.replace(/_/g, " ")}</p>
        <p className="win-kills">{gameOver.kill_count} kill{gameOver.kill_count !== 1 ? "s" : ""}</p>
        <div className="win-actions">
          <button className="win-btn win-btn-primary" onClick={handleRestart}>
            Play Again
          </button>
          <button className="win-btn win-btn-secondary" onClick={() => router.push("/")}>
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
