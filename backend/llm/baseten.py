from __future__ import annotations
import os
import json
import asyncio
import random
from openai import AsyncOpenAI

_client: AsyncOpenAI | None = None

BASETEN_BRIDGE_URL = "https://bridge.baseten.co/v1/direct"
LLM_TIMEOUT = 8.0  # seconds


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=os.environ["BASETEN_API_KEY"],
            base_url=BASETEN_BRIDGE_URL,
        )
    return _client


INTERACTION_SCHEMA = """{
  "thought_process": "<internal reasoning, 1-2 sentences>",
  "spoken_dialogue": "<what you say out loud to the other agent, max 2 sentences>",
  "action": "<one of: ATTACK, TRADE, ALLY, FLEE, STEAL, NEGOTIATE, INTIMIDATE, HEAL, IGNORE>",
  "action_target": "<name of the target agent>",
  "emotional_state": "<one word emotion>"
}"""

FALLBACK_ACTIONS = {
    "berserker": ("ATTACK", "Furious", "Back off or bleed."),
    "paranoid_guard": ("INTIMIDATE", "Suspicious", "State your business. Now."),
    "greedy_merchant": ("NEGOTIATE", "Calculating", "Everything has a price. Name yours."),
    "backstabbing_diplomat": ("ALLY", "Charming", "Friend! Finally, a face I can trust."),
    "cowardly_thief": ("FLEE", "Panicked", "Sorry sorry sorry, didn't see you there!"),
    "righteous_paladin": ("NEGOTIATE", "Resolute", "Stand down. We need not fight today."),
    "wandering_healer": ("HEAL", "Compassionate", "You look hurt. Let me help."),
    "silent_assassin": ("ATTACK", "Cold", "..."),
    "mad_prophet": ("IGNORE", "Erratic", "The stars warned me of this meeting!"),
    "peaceful_scholar": ("NEGOTIATE", "Curious", "Fascinating. Tell me about yourself."),
    "charismatic_warlord": ("ALLY", "Commanding", "Join me. Together we're unstoppable."),
    "cynical_mercenary": ("NEGOTIATE", "Detached", "I'm not cheap. What's the job?"),
    "territorial_beast": ("INTIMIDATE", "Aggressive", "You're in my zone. Leave. Now."),
    "vengeful_widow": ("ATTACK", "Wrathful", "You'll do."),
    "naive_idealist": ("ALLY", "Hopeful", "Oh! A new friend, maybe?"),
    "master_manipulator": ("NEGOTIATE", "Serene", "How interesting to meet you here."),
    "reckless_gambler": ("STEAL", "Euphoric", "Double or nothing — I always bet on me."),
    "forgotten_king": ("INTIMIDATE", "Melancholic", "Do you not know who I am?"),
    "gluttonous_baron": ("STEAL", "Entitled", "That belongs to me now. Obviously."),
    "cunning_spy": ("NEGOTIATE", "Analytical", "I know more about you than you think."),
}


async def call_interaction_llm(
    agent_a_prompt: str,
    agent_a_name: str,
    agent_a_archetype: str,
    agent_a_memory: list[str],
    agent_a_energy: int,
    agent_b_name: str,
    agent_b_archetype: str,
    agent_b_memory: list[str],
    agent_b_health: int,
    agent_b_gold: int,
    long_term_memories: list[str] | None = None,
) -> dict:
    messages = _build_messages(
        agent_a_prompt, agent_a_name, agent_a_memory, agent_a_energy,
        agent_b_name, agent_b_archetype, agent_b_health, agent_b_gold, agent_b_memory,
        long_term_memories=long_term_memories or [],
    )

    model_id = os.environ.get("BASETEN_MODEL_ID", "")

    try:
        client = get_client()
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=model_id,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.85,
                max_tokens=300,
            ),
            timeout=LLM_TIMEOUT,
        )
        raw = response.choices[0].message.content or ""
        return _parse_response(raw, agent_a_archetype, agent_b_name)

    except asyncio.TimeoutError:
        return _fallback_response(agent_a_archetype, agent_b_name)
    except Exception:
        return _fallback_response(agent_a_archetype, agent_b_name)


def _build_messages(
    system_prompt: str,
    my_name: str,
    my_memory: list[str],
    my_energy: int,
    their_name: str,
    their_archetype: str,
    their_health: int,
    their_gold: int,
    their_memory: list[str],
    long_term_memories: list[str] | None = None,
) -> list[dict]:
    memory_str = "\n".join(f"- {m}" for m in my_memory[-10:]) or "Nothing yet."
    ltm_section = ""
    if long_term_memories:
        ltm_str = "\n".join(f"- {m}" for m in long_term_memories)
        ltm_section = f"\nRelevant long-term memories (past encounters):\n{ltm_str}\n"
    energy_note = " — CRITICAL: you are starving, death is near!" if my_energy < 20 else ""
    return [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": (
                f"You are {my_name}. You have just encountered {their_name}.\n\n"
                f"Your stats: Energy {my_energy}/100{energy_note}\n\n"
                f"Your recent memory:\n{memory_str}\n"
                f"{ltm_section}\n"
                f"What you can observe about {their_name}:\n"
                f"- Health: {their_health}/100\n"
                f"- Gold visible: {their_gold}\n\n"
                f"Respond ONLY with a valid JSON object matching this schema:\n{INTERACTION_SCHEMA}"
            ),
        },
    ]


def _parse_response(raw: str, archetype: str, target_name: str) -> dict:
    try:
        data = json.loads(raw)
        valid_actions = {
            "ATTACK", "TRADE", "ALLY", "FLEE", "STEAL",
            "NEGOTIATE", "INTIMIDATE", "HEAL", "IGNORE",
        }
        action = data.get("action", "IGNORE").upper()
        if action not in valid_actions:
            action = "IGNORE"
        return {
            "thought_process": str(data.get("thought_process", ""))[:200],
            "spoken_dialogue": str(data.get("spoken_dialogue", "..."))[:150],
            "action": action,
            "action_target": target_name,
            "emotional_state": str(data.get("emotional_state", "Neutral"))[:20],
        }
    except (json.JSONDecodeError, KeyError):
        return _fallback_response(archetype, target_name)


def _fallback_response(archetype: str, target_name: str) -> dict:
    defaults = FALLBACK_ACTIONS.get(archetype, ("IGNORE", "Neutral", "..."))
    action, emotion, dialogue = defaults
    return {
        "thought_process": "Acting on instinct.",
        "spoken_dialogue": dialogue,
        "action": action,
        "action_target": target_name,
        "emotional_state": emotion,
    }
