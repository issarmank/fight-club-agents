from __future__ import annotations
import asyncio
from agents.agent import AgentState
from game.grid import GameState

TICK_INTERVAL = 0.5  # seconds
COOLDOWN_TICKS = 6   # ~3 seconds of post-interaction cooldown


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

        # Stop processing once the game is over; just keep the connection alive
        if gs.game_over:
            return

        gs.tick_count += 1

        # Passive stat decay
        for agent in gs.agents:
            if agent.health <= 0:
                continue
            agent.energy = max(0, agent.energy - 0.5)
            if agent.energy <= 0:
                agent.health = 0
            if agent.interaction_cooldown > 0:
                agent.interaction_cooldown -= 1
                if agent.interaction_cooldown == 0 and agent.state == AgentState.INTERACTING:
                    agent.state = AgentState.IDLE

        # Mark newly dead agents
        for agent in gs.agents:
            if agent.health <= 0 and agent.death_tick is None:
                agent.death_tick = gs.tick_count
                agent.state = AgentState.IDLE

        alive = [a for a in gs.agents if a.health > 0]

        # Last agent standing — declare winner
        if len(alive) == 1:
            gs.game_over = True
            winner = alive[0]
            await self.broadcast({
                "type": "GAME_OVER",
                "tick": gs.tick_count,
                "winner": {
                    "id": winner.id,
                    "name": winner.name,
                    "color": winner.color,
                    "archetype": winner.archetype,
                    "kill_count": winner.kill_count,
                },
            })
            # Still send a final delta so the UI reflects the last state
            await self.broadcast({
                "type": "GAME_DELTA",
                "tick": gs.tick_count,
                "agents": [a.to_delta_dict() for a in gs.agents],
                "resources": [r.to_dict() for r in gs.resources],
            })
            return

        # Everyone died simultaneously — no winner
        if len(alive) == 0:
            gs.game_over = True
            await self.broadcast({
                "type": "ROUND_OVER",
                "tick": gs.tick_count,
            })
            return

        # Move agents
        for agent in gs.agents:
            if agent.health > 0 and agent.is_available():
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
