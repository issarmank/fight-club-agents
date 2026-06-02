// components/game/Arena.tsx — live canvas renderer for the arena.
// Reads the latest snapshot from the Zustand store inside a requestAnimationFrame
// loop (so 60fps rendering is decoupled from the 2Hz server tick) and smoothly
// interpolates agent positions between ticks.
"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/useGameStore";
import { shortName } from "@/lib/agents";
import type { Agent } from "@/lib/types";

interface RPos {
  x: number;
  y: number;
}

export default function Arena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rposRef = useRef<Record<string, RPos>>({});
  const hoverRef = useRef<string | null>(null);
  const hitAtRef = useRef<Record<string, number>>({});

  // Track ATTACK targets for the red "under attack" ring.
  useEffect(() => {
    let lastId: string | null = null;
    const unsub = useGameStore.subscribe((state) => {
      const ev = state.events[0];
      if (ev && ev.id !== lastId) {
        lastId = ev.id;
        if (ev.action === "ATTACK") hitAtRef.current[ev.agent_b.id] = performance.now();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let SIZE = 540;
    let CELL = SIZE / 30;
    let raf = 0;

    const fit = () => {
      const pad = 44;
      const avail = Math.min(wrap.clientWidth - pad, wrap.clientHeight - pad);
      SIZE = Math.max(280, Math.floor(avail));
      const grid = useGameStore.getState().grid.width || 30;
      CELL = SIZE / grid;
      canvas.style.width = SIZE + "px";
      canvas.style.height = SIZE + "px";
      canvas.width = Math.floor(SIZE * DPR);
      canvas.height = Math.floor(SIZE * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    fit();

    const cx = (gx: number) => (gx + 0.5) * CELL;
    const cy = (gy: number) => (gy + 0.5) * CELL;

    const hexA = (hex: string, a: number) => {
      const h = hex.replace("#", "");
      const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
      const r = parseInt(n.slice(0, 2), 16);
      const g = parseInt(n.slice(2, 4), 16);
      const b = parseInt(n.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      r = Math.min(r, h / 2, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const label = (text: string, x: number, y: number, color: string) => {
      ctx.save();
      ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif";
      const w = ctx.measureText(text).width + 14;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.strokeStyle = hexA(color, 0.5);
      ctx.lineWidth = 1;
      roundRect(x - w / 2, y, w, 17, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#1C1815";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y + 9);
      ctx.restore();
    };

    const bubble = (text: string, x: number, y: number) => {
      ctx.save();
      ctx.font = "italic 11px system-ui, -apple-system, 'Segoe UI', sans-serif";
      const t = text.length > 36 ? text.slice(0, 34) + "…" : text;
      const w = Math.min(190, ctx.measureText(t).width + 18);
      const h = 22;
      let bx = x - w / 2;
      bx = Math.max(4, Math.min(SIZE - w - 4, bx));
      const by = Math.max(4, y - h);
      ctx.fillStyle = "#1C1815";
      roundRect(bx, by, w, h, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 5, by + h);
      ctx.lineTo(x + 5, by + h);
      ctx.lineTo(x, by + h + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#FBF9F6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t, bx + w / 2, by + h / 2 + 1);
      ctx.restore();
    };

    // Most recent spoken line per agent, with expiry, derived from events.
    const lastSaid: Record<string, { text: string; at: number }> = {};
    let lastEvId: string | null = null;

    const drawAgent = (a: Agent, rp: RPos, sel: Agent | null) => {
      const x = cx(rp.x);
      const y = cy(rp.y);
      const R = Math.max(5, CELL * 0.36);
      const related =
        sel &&
        (sel.id === a.id ||
          sel.ally_ids.includes(a.id) ||
          sel.enemy_ids.includes(a.id));
      const dim = sel && !related;
      ctx.save();
      ctx.globalAlpha = dim ? 0.45 : 1;

      let ring: string | null = null;
      const hitAt = hitAtRef.current[a.id];
      if (hitAt && performance.now() - hitAt < 1200) ring = "#DC143C";
      else if (a.state === "INTERACTING") ring = "#ffffff";
      else if (a.state === "WAITING_FOR_AI" || a.state === "EXECUTING_ACTION")
        ring = "#C2410C";

      if (ring) {
        ctx.beginPath();
        ctx.arc(x, y, R + 4, 0, Math.PI * 2);
        ctx.fillStyle = hexA(ring === "#ffffff" ? "#E8B23A" : ring, 0.18);
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = ring;
        ctx.stroke();
      }
      if (sel && sel.id === a.id) {
        ctx.beginPath();
        ctx.arc(x, y, R + 7, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = hexA(a.color, 0.9);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = a.color;
      ctx.shadowColor = hexA(a.color, 0.5);
      ctx.shadowBlur = dim ? 0 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();

      if (a.health < 100) {
        const bw = R * 2.2;
        const bh = 3.2;
        const bx = x - bw / 2;
        const by = y - R - 8;
        ctx.fillStyle = "rgba(28,24,21,0.12)";
        roundRect(bx, by, bw, bh, 2);
        ctx.fill();
        const hp = Math.max(0, a.health) / 100;
        ctx.fillStyle =
          a.health > 50 ? "#2F8F5B" : a.health > 25 ? "#E8B23A" : "#DC143C";
        roundRect(bx, by, bw * hp, bh, 2);
        ctx.fill();
      }
      ctx.restore();

      if (sel?.id === a.id || hoverRef.current === a.id) {
        label(shortName(a.name), x, y + R + 6, a.color);
      }
      const said = lastSaid[a.id];
      if (said && performance.now() - said.at < 3000) {
        bubble(said.text, x, y - R - 14);
      }
    };

    const draw = () => {
      const s = useGameStore.getState();
      const grid = s.grid.width || 30;

      // capture newest spoken line
      const ev = s.events[0];
      if (ev && ev.id !== lastEvId) {
        lastEvId = ev.id;
        lastSaid[ev.agent_a.id] = { text: ev.spoken_dialogue, at: performance.now() };
      }

      ctx.clearRect(0, 0, SIZE, SIZE);

      // grid lines
      ctx.strokeStyle = "rgba(28,24,21,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= grid; i++) {
        const p = Math.round(i * CELL) + 0.5;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(SIZE, p);
        ctx.stroke();
      }

      const sel = s.selectedId ? s.agentsById[s.selectedId] : null;

      // ally / enemy links for the selected agent
      if (sel && sel.health > 0) {
        const rs = rposRef.current[sel.id];
        const link = (id: string, color: string) => {
          const rp = rposRef.current[id];
          if (!rp || !rs) return;
          ctx.strokeStyle = hexA(color, 0.5);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx(rs.x), cy(rs.y));
          ctx.lineTo(cx(rp.x), cy(rp.y));
          ctx.stroke();
        };
        sel.ally_ids.forEach((id) => link(id, "#2F8F5B"));
        sel.enemy_ids.forEach((id) => link(id, "#DC143C"));
      }

      // resources
      s.resources.forEach((r) => {
        const x = cx(r.x);
        const y = cy(r.y);
        const size = CELL * 0.3;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = r.color;
        ctx.shadowColor = hexA(r.color, 0.6);
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // agents (interpolate toward server position)
      s.agents.forEach((a) => {
        let rp = rposRef.current[a.id];
        if (!rp) rp = rposRef.current[a.id] = { x: a.x, y: a.y };
        rp.x += (a.x - rp.x) * 0.28;
        rp.y += (a.y - rp.y) * 0.28;
        if (a.health > 0) drawAgent(a, rp, sel);
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // ---- picking ----
    const pickAt = (clientX: number, clientY: number): Agent | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((clientX - rect.left) / rect.width) * SIZE;
      const my = ((clientY - rect.top) / rect.height) * SIZE;
      const s = useGameStore.getState();
      let best: Agent | null = null;
      let bd = Infinity;
      s.agents.forEach((a) => {
        if (a.health <= 0) return;
        const rp = rposRef.current[a.id];
        if (!rp) return;
        const dx = cx(rp.x) - mx;
        const dy = cy(rp.y) - my;
        const d = dx * dx + dy * dy;
        if (d < bd && d < (CELL * 0.7) ** 2) {
          bd = d;
          best = a;
        }
      });
      return best;
    };

    const onMove = (e: MouseEvent) => {
      const a = pickAt(e.clientX, e.clientY);
      hoverRef.current = a ? a.id : null;
      canvas.style.cursor = a ? "pointer" : "default";
    };
    const onLeave = () => (hoverRef.current = null);
    const onClick = (e: MouseEvent) => {
      const a = pickAt(e.clientX, e.clientY);
      useGameStore.getState().select(a ? a.id : null);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  const status = useGameStore((s) => s.status);
  const hasAgents = useGameStore((s) => s.agents.length > 0);

  return (
    <div className="col arena-col" ref={wrapRef}>
      <canvas className="arena-canvas" ref={canvasRef} />
      <div className="arena-hint">click an agent · hover for name</div>
      <div className="arena-legend">
        <div className="lg">
          <span className="ring" style={{ borderColor: "#fff", background: "#bbb" }} />
          interacting
        </div>
        <div className="lg">
          <span className="ring" style={{ borderColor: "var(--burnt)" }} />
          thinking / acting
        </div>
        <div className="lg">
          <span className="ring" style={{ borderColor: "var(--bad)" }} />
          under attack
        </div>
      </div>
      {!hasAgents && (
        <div className="arena-status">
          <div className="box">
            {status === "open"
              ? "Connected — waiting for the first world snapshot…"
              : status === "connecting"
              ? "Connecting to the arena…"
              : "Arena offline. Start the backend (uvicorn) and it will connect automatically."}
          </div>
        </div>
      )}
    </div>
  );
}
