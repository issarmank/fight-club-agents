from __future__ import annotations
import asyncio
import uuid
from datetime import datetime, timezone
from agents.agent import Agent, AgentState
from game.grid import GameState
from llm.baseten import call_interaction_llm
import memory.pinecone_memory as ltm

ATTACK_DAMAGE = 35
ATTACK_ENERGY_COST = 10
NEGOTIATE_ENERGY = 5
STEAL_GOLD = 15
TRADE_GOLD = 10


class EventHandler:
    def __init__(self, game_state: GameState, broadcast):
        self.game_state = game_state
        self.broadcast = broadcast
        self.queue: asyncio.Queue = asyncio.Queue()
        self._agent_map: dict[str, Agent] = {}
        self._refresh_agent_map()

    def _refresh_agent_map(self) -> None:
        self._agent_map = {a.id: a for a in self.game_state.agents}

    async def run(self) -> None:
        # Process up to 5 events concurrently
        semaphore = asyncio.Semaphore(5)
        while True:
            event = await self.queue.get()
            asyncio.create_task(self._handle_with_semaphore(event, semaphore))

    async def _handle_with_semaphore(self, event: dict, semaphore: asyncio.Semaphore) -> None:
        async with semaphore:
            await self._dispatch(event)

    async def _dispatch(self, event: dict) -> None:
        if event["type"] == "COLLISION":
            await self._handle_collision(event)

    async def _handle_collision(self, event: dict) -> None:
        self._refresh_agent_map()
        a = self._agent_map.get(event["agent_a_id"])
        b = self._agent_map.get(event["agent_b_id"])

        if not a or not b or a.health <= 0 or b.health <= 0:
            return

        # Skip if either agent already has an in-flight LLM call
        if a.in_flight_llm or b.in_flight_llm:
            return

        a.state = AgentState.WAITING_FOR_AI
        b.state = AgentState.WAITING_FOR_AI
        a.in_flight_llm = True
        b.in_flight_llm = True

        # Recall relevant long-term memories for agent_a before the LLM call
        long_term = []
        if ltm.is_configured():
            query = f"Encounter with {b.name} ({b.archetype})"
            long_term = await ltm.recall_memories(a.id, query, top_k=5)

        try:
            result = await call_interaction_llm(
                agent_a_prompt=a.system_prompt,
                agent_a_name=a.name,
                agent_a_archetype=a.archetype,
                agent_a_memory=list(a.short_term_memory),
                agent_a_energy=int(a.energy),
                agent_b_name=b.name,
                agent_b_archetype=b.archetype,
                agent_b_memory=list(b.short_term_memory),
                agent_b_health=b.health,
                agent_b_gold=b.gold,
                long_term_memories=long_term,
            )

            a.state = AgentState.EXECUTING_ACTION
            a.emotional_state = result["emotional_state"]

            self._apply_action(a, b, result["action"])

            memory_line_a = f"Met {b.name}: said '{result['spoken_dialogue'][:60]}', did {result['action']}"
            memory_line_b = f"Met {a.name}: they said '{result['spoken_dialogue'][:60]}', they did {result['action']}"
            a.add_memory(memory_line_a)
            if result["action"] != "IGNORE":
                b.add_memory(memory_line_b)

            # Persist interaction memories to Pinecone (fire-and-forget)
            if ltm.is_configured():
                tick = event["tick"]
                asyncio.create_task(ltm.store_memory(a.id, memory_line_a, tick))
                asyncio.create_task(ltm.store_memory(b.id, memory_line_b, tick))

            event_payload = {
                "type": "EVENT",
                "event_type": "COLLISION",
                "id": str(uuid.uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "tick": event["tick"],
                "agent_a": {"id": a.id, "name": a.name, "color": a.color},
                "agent_b": {"id": b.id, "name": b.name, "color": b.color},
                "thought_process": result["thought_process"],
                "spoken_dialogue": result["spoken_dialogue"],
                "action": result["action"],
                "emotional_state": result["emotional_state"],
            }
            await self.broadcast(event_payload)

        except Exception:
            pass  # call_interaction_llm already returns a fallback; this guards broadcast/apply

        finally:
            a.in_flight_llm = False
            b.in_flight_llm = False
            # Always release agents — prevents permanent WAITING_FOR_AI freeze
            if a.state not in (AgentState.IDLE, AgentState.MOVING):
                a.state = AgentState.IDLE
            if b.state not in (AgentState.IDLE, AgentState.MOVING):
                b.state = AgentState.IDLE

    def _push_agent(self, agent: Agent, away_from: Agent) -> None:
        from game.grid import GRID_WIDTH, GRID_HEIGHT
        occupied = {(a.x, a.y) for a in self.game_state.agents if a.id != agent.id}
        dx = 0 if agent.x == away_from.x else (1 if agent.x > away_from.x else -1)
        dy = 0 if agent.y == away_from.y else (1 if agent.y > away_from.y else -1)
        # Try to push 2 tiles; fall back to 1 if blocked
        for dist in (2, 1):
            nx = max(0, min(GRID_WIDTH - 1, agent.x + dx * dist))
            ny = max(0, min(GRID_HEIGHT - 1, agent.y + dy * dist))
            if (nx, ny) not in occupied:
                agent.x = nx
                agent.y = ny
                return

    def _apply_action(self, actor: Agent, target: Agent, action: str) -> None:
        if action == "ATTACK":
            target.health -= ATTACK_DAMAGE
            actor.energy = max(0, actor.energy - ATTACK_ENERGY_COST)
            actor.add_memory(f"Attacked {target.name} for {ATTACK_DAMAGE} damage")
            if target.health <= 0:
                actor.kill_count += 1
                actor.add_memory(f"Killed {target.name}!")
                actor.gold += target.gold // 2
                target.gold = target.gold // 2

        elif action == "STEAL":
            stolen = min(STEAL_GOLD, target.gold)
            target.gold -= stolen
            actor.gold += stolen
            actor.add_memory(f"Stole {stolen} gold from {target.name}")

        elif action == "TRADE":
            amount = min(TRADE_GOLD, actor.gold)
            actor.gold -= amount
            target.gold += amount
            actor.add_memory(f"Traded {amount} gold with {target.name}")

        elif action == "ALLY":
            if target.id not in actor.ally_ids:
                actor.ally_ids.append(target.id)
            if actor.id not in target.ally_ids:
                target.ally_ids.append(actor.id)
            actor.enemy_ids = [eid for eid in actor.enemy_ids if eid != target.id]
            target.enemy_ids = [eid for eid in target.enemy_ids if eid != actor.id]

        elif action == "FLEE":
            self._push_agent(actor, target)
            actor.add_memory(f"Fled from {target.name}")

        elif action == "HEAL":
            target.health = min(100, target.health + 20)
            actor.add_memory(f"Healed {target.name} for 20 HP")

        elif action == "INTIMIDATE":
            if target.id not in actor.enemy_ids:
                actor.enemy_ids.append(target.id)

        elif action == "NEGOTIATE":
            actor.energy = min(100, actor.energy + NEGOTIATE_ENERGY)
            target.energy = min(100, target.energy + NEGOTIATE_ENERGY)
            actor.add_memory(f"Negotiated with {target.name}")

        elif action == "IGNORE":
            actor.add_memory(f"Ignored {target.name}")
