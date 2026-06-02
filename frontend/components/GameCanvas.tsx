"use client";

import { Stage, Layer, Rect, Circle, Text } from "react-konva";
import { useGameStore } from "@/lib/store";
import type { AgentData, ResourceData } from "@/lib/types";

const CELL = 20;
const GRID_W = 30;
const GRID_H = 30;
const CANVAS_W = CELL * GRID_W;
const CANVAS_H = CELL * GRID_H;
const AGENT_RADIUS = 7;

function getStateGlow(state: string): string {
  switch (state) {
    case "INTERACTING": return "#ffffff";
    case "WAITING_FOR_AI": return "#00ffff";
    case "EXECUTING_ACTION": return "#ff4400";
    default: return "";
  }
}

function AgentCircle({
  agent,
  onSelect,
  isSelected,
}: {
  agent: AgentData;
  onSelect: (a: AgentData) => void;
  isSelected: boolean;
}) {
  const cx = agent.x * CELL + CELL / 2;
  const cy = agent.y * CELL + CELL / 2;
  const glow = getStateGlow(agent.state);
  const isDead = agent.health <= 0;

  return (
    <>
      {/* Glow ring for active states */}
      {glow && !isDead && (
        <Circle
          x={cx}
          y={cy}
          radius={AGENT_RADIUS + 4}
          fill="transparent"
          stroke={glow}
          strokeWidth={2}
          opacity={0.7}
        />
      )}
      {/* Selection ring */}
      {isSelected && (
        <Circle
          x={cx}
          y={cy}
          radius={AGENT_RADIUS + 6}
          fill="transparent"
          stroke="#ffffff"
          strokeWidth={1.5}
          dash={[3, 3]}
        />
      )}
      {/* Health bar background */}
      <Rect
        x={cx - AGENT_RADIUS}
        y={cy - AGENT_RADIUS - 5}
        width={AGENT_RADIUS * 2}
        height={2}
        fill="#333"
        cornerRadius={1}
      />
      {/* Health bar fill */}
      <Rect
        x={cx - AGENT_RADIUS}
        y={cy - AGENT_RADIUS - 5}
        width={(AGENT_RADIUS * 2 * Math.max(0, agent.health)) / 100}
        height={2}
        fill={agent.health > 50 ? "#22c55e" : agent.health > 25 ? "#eab308" : "#ef4444"}
        cornerRadius={1}
      />
      {/* Agent body */}
      <Circle
        x={cx}
        y={cy}
        radius={AGENT_RADIUS}
        fill={isDead ? "#444" : agent.color}
        opacity={isDead ? 0.3 : 1}
        stroke={isDead ? "#222" : "#000"}
        strokeWidth={1}
        onClick={() => !isDead && onSelect(agent)}
        onTap={() => !isDead && onSelect(agent)}
        style={{ cursor: "pointer" }}
      />
    </>
  );
}

function ResourceDot({ resource }: { resource: ResourceData }) {
  const cx = resource.x * CELL + CELL / 2;
  const cy = resource.y * CELL + CELL / 2;
  return (
    <Rect
      x={cx - 3}
      y={cy - 3}
      width={6}
      height={6}
      fill={resource.color}
      cornerRadius={1}
      opacity={0.9}
    />
  );
}

export default function GameCanvas() {
  const { gameState, selectedAgent, setSelectedAgent } = useGameStore();

  if (!gameState) {
    return (
      <div
        className="flex items-center justify-center bg-game-bg border border-border-dim rounded"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        <span className="text-gray-500 font-mono text-sm animate-pulse">
          Connecting to game server...
        </span>
      </div>
    );
  }

  return (
    <div className="rounded overflow-hidden border border-border-dim">
      <Stage width={CANVAS_W} height={CANVAS_H}>
        {/* Grid background */}
        <Layer>
          <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#0d0d16" />
          {Array.from({ length: GRID_W + 1 }, (_, i) => (
            <Rect
              key={`vl-${i}`}
              x={i * CELL}
              y={0}
              width={0.5}
              height={CANVAS_H}
              fill="#1a1a2a"
            />
          ))}
          {Array.from({ length: GRID_H + 1 }, (_, i) => (
            <Rect
              key={`hl-${i}`}
              x={0}
              y={i * CELL}
              width={CANVAS_W}
              height={0.5}
              fill="#1a1a2a"
            />
          ))}
        </Layer>

        {/* Resources */}
        <Layer>
          {gameState.resources.map((r) => (
            <ResourceDot key={`${r.x}-${r.y}`} resource={r} />
          ))}
        </Layer>

        {/* Agents */}
        <Layer>
          {gameState.agents.map((agent) => (
            <AgentCircle
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent?.id === agent.id}
              onSelect={setSelectedAgent}
            />
          ))}
        </Layer>

        {/* Agent name labels — only for interacting agents to reduce noise */}
        <Layer>
          {gameState.agents
            .filter(
              (a) =>
                a.health > 0 &&
                (a.state === "INTERACTING" ||
                  a.state === "WAITING_FOR_AI" ||
                  a.state === "EXECUTING_ACTION")
            )
            .map((agent) => (
              <Text
                key={`lbl-${agent.id}`}
                x={agent.x * CELL + CELL / 2 - 30}
                y={agent.y * CELL - 14}
                text={agent.name.replace("The ", "")}
                fontSize={8}
                fill="#ffffff"
                width={60}
                align="center"
                opacity={0.8}
              />
            ))}
        </Layer>
      </Stage>
    </div>
  );
}
