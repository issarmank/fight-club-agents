from __future__ import annotations
import random
from agents.agent import Agent, MovementBias

GRID_WIDTH = 30
GRID_HEIGHT = 30

RESOURCE_TYPES = {
    "apple": {"energy": 15, "health": 0, "gold": 0, "color": "#FF6B6B"},
    "gold_ore": {"energy": 0, "health": 0, "gold": 20, "color": "#FFD700"},
    "herb": {"energy": 0, "health": 20, "gold": 0, "color": "#90EE90"},
}
MAX_RESOURCES = 15
RESOURCE_SPAWN_CHANCE = 0.03  # per tick


class Resource:
    def __init__(self, x: int, y: int, rtype: str):
        self.x = x
        self.y = y
        self.type = rtype
        self.color = RESOURCE_TYPES[rtype]["color"]

    def to_dict(self) -> dict:
        return {"x": self.x, "y": self.y, "type": self.type, "color": self.color}


class GameState:
    def __init__(self, agents: list[Agent]):
        self.agents = agents
        self.resources: list[Resource] = []
        self.tick_count = 0
        self._spawn_initial_resources()

    def _spawn_initial_resources(self) -> None:
        occupied = {(a.x, a.y) for a in self.agents}
        for _ in range(MAX_RESOURCES // 2):
            self._try_spawn_resource(occupied)

    def _try_spawn_resource(self, occupied: set | None = None) -> None:
        if len(self.resources) >= MAX_RESOURCES:
            return
        if occupied is None:
            occupied = {(a.x, a.y) for a in self.agents} | {(r.x, r.y) for r in self.resources}
        for _ in range(10):
            x = random.randint(0, GRID_WIDTH - 1)
            y = random.randint(0, GRID_HEIGHT - 1)
            if (x, y) not in occupied:
                rtype = random.choice(list(RESOURCE_TYPES.keys()))
                self.resources.append(Resource(x, y, rtype))
                occupied.add((x, y))
                return

    def maybe_spawn_resource(self) -> None:
        if random.random() < RESOURCE_SPAWN_CHANCE:
            self._try_spawn_resource()

    def collect_resource(self, agent: Agent) -> Resource | None:
        for r in self.resources:
            if r.x == agent.x and r.y == agent.y:
                self.resources.remove(r)
                stats = RESOURCE_TYPES[r.type]
                agent.energy = min(100, agent.energy + stats["energy"])
                agent.health = min(100, agent.health + stats["health"])
                agent.gold += stats["gold"]
                agent.inventory.append(r.type)
                agent.add_memory(f"Picked up {r.type}")
                return r
        return None

    def move_agent(self, agent: Agent) -> None:
        if agent.state.value in ("INTERACTING", "WAITING_FOR_AI", "EXECUTING_ACTION"):
            return

        dx, dy = self._choose_direction(agent)
        nx = max(0, min(GRID_WIDTH - 1, agent.x + dx))
        ny = max(0, min(GRID_HEIGHT - 1, agent.y + dy))

        # Don't collide — just stop. Collision detection runs separately.
        others_pos = {(a.x, a.y) for a in self.agents if a.id != agent.id}
        if (nx, ny) not in others_pos:
            agent.x = nx
            agent.y = ny

        from agents.agent import AgentState
        agent.state = AgentState.MOVING

    def _choose_direction(self, agent: Agent) -> tuple[int, int]:
        directions = [(0, 1), (0, -1), (1, 0), (-1, 0), (0, 0)]

        if agent.movement_bias == MovementBias.PATROL and agent.patrol_origin:
            ox, oy = agent.patrol_origin
            radius = 5
            # If within patrol radius, random. If outside, drift back.
            if abs(agent.x - ox) > radius or abs(agent.y - oy) > radius:
                dx = (1 if ox > agent.x else -1) if ox != agent.x else 0
                dy = (1 if oy > agent.y else -1) if oy != agent.y else 0
                return dx, dy

        if agent.movement_bias == MovementBias.TOWARD_RESOURCES and self.resources:
            nearest = min(self.resources, key=lambda r: abs(r.x - agent.x) + abs(r.y - agent.y))
            return self._step_toward(agent.x, agent.y, nearest.x, nearest.y)

        if agent.movement_bias == MovementBias.TOWARD_AGENTS:
            others = [a for a in self.agents if a.id != agent.id and a.health > 0]
            if others:
                target = random.choice(others)
                return self._step_toward(agent.x, agent.y, target.x, target.y)

        if agent.movement_bias == MovementBias.TOWARD_WEAK:
            weak = [a for a in self.agents if a.id != agent.id and a.health > 0]
            if weak:
                target = min(weak, key=lambda a: a.health)
                return self._step_toward(agent.x, agent.y, target.x, target.y)

        return random.choice(directions)

    def _step_toward(self, x: int, y: int, tx: int, ty: int) -> tuple[int, int]:
        options = []
        if tx > x:
            options.append((1, 0))
        elif tx < x:
            options.append((-1, 0))
        if ty > y:
            options.append((0, 1))
        elif ty < y:
            options.append((0, -1))
        return random.choice(options) if options else (0, 0)

    def detect_collisions(self) -> list[tuple[Agent, Agent]]:
        pos_map: dict[tuple[int, int], list[Agent]] = {}
        for agent in self.agents:
            if agent.health <= 0:
                continue
            key = (agent.x, agent.y)
            pos_map.setdefault(key, []).append(agent)

        collisions = []
        for agents_at_pos in pos_map.values():
            if len(agents_at_pos) >= 2:
                a, b = agents_at_pos[0], agents_at_pos[1]
                if a.is_available() and b.is_available():
                    collisions.append((a, b))
        return collisions

    def to_dict(self) -> dict:
        return {
            "type": "GAME_STATE",
            "tick": self.tick_count,
            "agents": [a.to_dict() for a in self.agents],
            "resources": [r.to_dict() for r in self.resources],
            "grid": {"width": GRID_WIDTH, "height": GRID_HEIGHT},
        }
