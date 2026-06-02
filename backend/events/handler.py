from __future__ import annotations
import asyncio
import uuid
from datetime import datetime, timezone
from agents.agent import Agent, AgentState
from game.grid import GameState
from llm.baseten import call_interaction_llm

ATTACK_DAMAGE = 25
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

        a.state = AgentState.WAITING_FOR_AI
        b.state = AgentState.WAITING_FOR_AI

        result = await call_interaction_llm(
            agent_a_prompt=a.system_prompt,
            agent_a_name=a.name,
            agent_a_archetype=a.archetype,
            agent_a_memory=list(a.short_term_memory),
            agent_b_name=b.name,
            agent_b_archetype=b.archetype,
            agent_b_memory=list(b.short_term_memory),
            agent_b_health=b.health,
            agent_b_gold=b.gold,
        )

        a.state = AgentState.EXECUTING_ACTION
        a.emotional_state = result["emotional_state"]

        self._apply_action(a, b, result["action"])

        memory_line_a = f"Met {b.name}: said '{result['spoken_dialogue'][:60]}', did {result['action']}"
        memory_line_b = f"Met {a.name}: they said '{result['spoken_dialogue'][:60]}', they did {result['action']}"
        a.add_memory(memory_line_a)
        b.add_memory(memory_line_b)

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

        a.state = AgentState.IDLE
        b.state = AgentState.IDLE

    def _apply_action(self, actor: Agent, target: Agent, action: str) -> None:
        if action == "ATTACK":
            target.health -= ATTACK_DAMAGE
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
            # Remove from enemies if present
            actor.enemy_ids = [eid for eid in actor.enemy_ids if eid != target.id]
            target.enemy_ids = [eid for eid in target.enemy_ids if eid != actor.id]

        elif action == "FLEE":
            actor.add_memory(f"Fled from {target.name}")

        elif action == "HEAL":
            target.health = min(100, target.health + 20)
            actor.add_memory(f"Healed {target.name} for 20 HP")

        elif action == "INTIMIDATE":
            if target.id not in actor.enemy_ids:
                actor.enemy_ids.append(target.id)
