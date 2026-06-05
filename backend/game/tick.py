from __future__ import annotations
import asyncio
import random
from agents.agent import AgentState
from game.grid import GameState, GRID_WIDTH, GRID_HEIGHT

TICK_INTERVAL = 0.5  # seconds
COOLDOWN_TICKS = 6   # ~3 seconds of post-interaction cooldown
RESPAWN_TICKS = 20   # ticks an agent stays dead before respawning


class TickManager:
    def __init__(self, game_state: GameState, event_queue: asyncio.Queue, broadcast):
        self.game_state = game_state
        self.event_queue = event_queue
        self.broadcast = broadcast

    async def run(self) -> None:
        while True:
            await asyncio.sleep(TICK_INTERVAL)
            await self._tick()

    async def _tick(self) -> None:
        gs = self.game_state
        gs.tick_count += 1

        # Passive stat decay
        for agent in gs.agents:
            if agent.health <= 0:
                continue
            agent.energy = max(0, agent.energy - 0.5)
            if agent.interaction_cooldown > 0:
                agent.interaction_cooldown -= 1
                if agent.interaction_cooldown == 0 and agent.state == AgentState.INTERACTING:
                    agent.state = AgentState.IDLE

        # Mark newly dead agents with their death_tick
        for agent in gs.agents:
            if (agent.health <= 0 or agent.energy <= 0) and agent.death_tick is None:
                agent.death_tick = gs.tick_count
                agent.state = AgentState.IDLE

        # Check for round over (all agents simultaneously dead)
        alive = [a for a in gs.agents if a.health > 0 and a.energy > 0]
        if len(alive) == 0 and len(gs.agents) > 0:
            await self.broadcast({
                "type": "ROUND_OVER",
                "tick": gs.tick_count,
            })

        # Respawn agents that have been dead for RESPAWN_TICKS
        occupied_positions = {(a.x, a.y) for a in gs.agents if a.health > 0 and a.energy > 0}
        for agent in gs.agents:
            if (agent.health <= 0 or agent.energy <= 0) and agent.death_tick is not None:
                ticks_dead = gs.tick_count - agent.death_tick
                if ticks_dead >= RESPAWN_TICKS:
                    # Find a random empty position
                    spawn_pos: tuple[int, int] | None = None
                    for _ in range(50):
                        rx = random.randint(0, GRID_WIDTH - 1)
                        ry = random.randint(0, GRID_HEIGHT - 1)
                        if (rx, ry) not in occupied_positions:
                            spawn_pos = (rx, ry)
                            break
                    if spawn_pos is None:
                        continue  # no free cell found, skip this tick

                    agent.x, agent.y = spawn_pos
                    occupied_positions.add(spawn_pos)
                    agent.health = 100
                    agent.energy = 100
                    agent.kill_count = 0
                    agent.gold = 10 + (abs(hash(agent.name)) % 40)
                    agent.short_term_memory.clear()
                    agent.interaction_cooldown = 0
                    agent.state = AgentState.IDLE
                    agent.death_tick = None

                    await self.broadcast({
                        "type": "RESPAWN",
                        "tick": gs.tick_count,
                        "agent": {"id": agent.id, "name": agent.name, "color": agent.color},
                        "x": agent.x,
                        "y": agent.y,
                    })

        # Move agents
        for agent in gs.agents:
            if agent.health > 0 and agent.energy > 0 and agent.is_available():
                gs.move_agent(agent)
                gs.collect_resource(agent)

        # Spawn resources occasionally
        gs.maybe_spawn_resource()

        # Detect collisions → push events
        for agent_a, agent_b in gs.detect_collisions():
            agent_a.state = AgentState.INTERACTING
            agent_b.state = AgentState.INTERACTING
            agent_a.interaction_cooldown = COOLDOWN_TICKS
            agent_b.interaction_cooldown = COOLDOWN_TICKS
            agent_a.interaction_count += 1
            agent_b.interaction_count += 1

            await self.event_queue.put({
                "type": "COLLISION",
                "agent_a_id": agent_a.id,
                "agent_b_id": agent_b.id,
                "tick": gs.tick_count,
            })

        # Broadcast a lightweight delta (mutable fields only)
        await self.broadcast({
            "type": "GAME_DELTA",
            "tick": gs.tick_count,
            "agents": [a.to_delta_dict() for a in gs.agents],
            "resources": [r.to_dict() for r in gs.resources],
        })
