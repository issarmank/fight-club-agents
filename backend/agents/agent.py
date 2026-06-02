from __future__ import annotations
from enum import Enum
from collections import deque
from typing import Optional


class AgentState(str, Enum):
    IDLE = "IDLE"
    MOVING = "MOVING"
    INTERACTING = "INTERACTING"
    WAITING_FOR_AI = "WAITING_FOR_AI"
    EXECUTING_ACTION = "EXECUTING_ACTION"


class MovementBias(str, Enum):
    RANDOM = "RANDOM"
    TOWARD_AGENTS = "TOWARD_AGENTS"
    TOWARD_RESOURCES = "TOWARD_RESOURCES"
    TOWARD_WEAK = "TOWARD_WEAK"
    PATROL = "PATROL"


class Agent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        archetype: str,
        x: int,
        y: int,
        color: str,
        system_prompt: str,
        movement_bias: MovementBias,
        default_emotional_state: str,
    ):
        self.id = agent_id
        self.name = name
        self.archetype = archetype
        self.x = x
        self.y = y
        self.color = color
        self.system_prompt = system_prompt
        self.movement_bias = movement_bias

        self.state = AgentState.IDLE
        self.emotional_state = default_emotional_state
        self.health = 100
        self.energy = 100
        self.gold = 10 + (abs(hash(name)) % 40)
        self.inventory: list[str] = []

        self.short_term_memory: deque[str] = deque(maxlen=15)
        self.interaction_cooldown = 0  # ticks before this agent can interact again
        self.patrol_origin: Optional[tuple[int, int]] = None

        self.ally_ids: list[str] = []
        self.enemy_ids: list[str] = []
        self.kill_count = 0
        self.interaction_count = 0

    def add_memory(self, event: str) -> None:
        self.short_term_memory.append(event)

    def is_available(self) -> bool:
        return (
            self.state in (AgentState.IDLE, AgentState.MOVING)
            and self.interaction_cooldown == 0
            and self.health > 0
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "archetype": self.archetype,
            "x": self.x,
            "y": self.y,
            "color": self.color,
            "state": self.state.value,
            "emotional_state": self.emotional_state,
            "health": max(0, self.health),
            "energy": max(0, self.energy),
            "gold": max(0, self.gold),
            "inventory": self.inventory,
            "ally_ids": self.ally_ids,
            "enemy_ids": self.enemy_ids,
            "kill_count": self.kill_count,
            "interaction_count": self.interaction_count,
            "recent_memory": list(self.short_term_memory)[-5:],
        }
