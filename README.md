# Fight Club Agents

Autonomous multi-agent sandbox simulation. Twenty AI personas are dropped on a 30×30 grid and left to act entirely on their own. When two agents collide, a live LLM call fires and the agent decides — in character — what to do. No player input. No win condition. Just emergent chaos.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688) ![Python](https://img.shields.io/badge/Python-3.11+-blue) ![WebSocket](https://img.shields.io/badge/WebSocket-real--time-orange)

---

## How It Works

- **30×30 grid**, ticking every 0.5 seconds
- Each tick: energy decays, agents move, resources spawn, collisions are detected, state is broadcast
- On collision: an async LLM call fires with the agent's personality + memory + observations about the target
- The LLM returns a structured action (attack, steal, heal, ally, flee, etc.) which is applied immediately
- Frontend receives a WebSocket delta every tick — it's read-only, the backend owns all state

---

## The 20 Agents

| Agent | Playstyle |
|-------|-----------|
| The Greedy Merchant | Rushes gold, trades for profit, bribes when threatened |
| The Paranoid Guard | Patrols territory, attacks with minimal provocation |
| The Backstabbing Diplomat | Forms alliances instantly, betrays them without hesitation |
| The Berserker | Hunts the weakest target, attacks on sight, never negotiates |
| The Wandering Healer | Heals anyone including enemies, avoids combat |
| The Silent Assassin | Stalks weak targets, strikes precisely, rarely speaks |
| The Charismatic Warlord | Builds ally factions, delegates combat, rewards loyalty |
| The Cowardly Thief | Steals opportunistically, flees any real threat |
| The Righteous Paladin | Protects the weak, challenges bullies, strict moral code |
| The Mad Prophet | Completely unpredictable, speaks in riddles |
| The Cunning Spy | Gathers intel, feeds false information, profits from chaos |
| The Gluttonous Baron | Hoards everything, throws tantrums when denied |
| The Vengeful Widow | Patient and methodical, targets those who wronged her |
| The Naive Idealist | Offers friendship to everyone, always surprised when betrayed |
| The Cynical Mercenary | Fights for whoever pays most, negotiates fee before engaging |
| The Territorial Beast | Claims a zone, expels or destroys any intruder |
| The Master Manipulator | Never fights directly, orchestrates conflicts between others |
| The Reckless Gambler | Proposes suicidal wagers, addicted to risk |
| The Peaceful Scholar | Observes and trades information, sometimes too absorbed to notice danger |
| The Forgotten King | Issues commands nobody obeys, erupts into rage when disrespected |

---

## Stack

**Backend** — FastAPI, Python 3.11+, WebSocket, async LLM via Baseten (OpenAI-compatible), optional Pinecone long-term memory

**Frontend** — Next.js 16, React 19, TypeScript, Konva (2D canvas), Three.js via `@react-three/fiber`, Zustand, Tailwind CSS

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 22+
- A [Baseten](https://baseten.co) account with a deployed LLM model
- (Optional) [Pinecone](https://pinecone.io) for persistent agent memory

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # set BACKEND_URL if not localhost
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `BASETEN_API_KEY` | Yes | Baseten API key |
| `BASETEN_MODEL_ID` | Yes | Deployed model ID on Baseten |
| `PINECONE_API_KEY` | No | Enables long-term agent memory |
| `PINECONE_INDEX_NAME` | No | Defaults to `fight-club-memories` |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend origins (e.g. `http://localhost:3000`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | No | Backend base URL — defaults to `http://localhost:8000` |

---

## Project Structure

```
backend/
  main.py                  # FastAPI app, WebSocket /ws endpoint, broadcast loop
  agents/
    agent.py               # Agent class — decision-making, movement, combat
    personalities.py       # 20 agent persona definitions
  game/
    grid.py                # GameState, GRID_WIDTH, GRID_HEIGHT
    tick.py                # TickManager — drives the simulation loop
  events/
    handler.py             # EventHandler — processes agent actions
  llm/
    baseten.py             # LLM client (OpenAI-compatible via Baseten)
  memory/
    pinecone_memory.py     # Optional long-term memory via Pinecone

frontend/
  app/                     # Next.js App Router pages
  components/
    game/                  # Canvas renderer, event feed, agent overlays
    landing/               # Landing page components
  lib/
    useGameStore.ts        # Zustand store — WebSocket client + state
    types.ts               # Shared TypeScript types
    agents.ts              # Agent metadata and action colors
```

---

## Actions

Nine possible outcomes when two agents collide:

| Action | Effect |
|--------|--------|
| ATTACK | Deals 25 damage. Killer takes half the target's gold on death |
| STEAL | Takes up to 15 gold from the target |
| TRADE | Gives up to 10 gold to the target |
| ALLY | Adds each agent to the other's ally list |
| FLEE | Actor moves away, no stat change |
| HEAL | Restores 20 HP to the target |
| INTIMIDATE | Marks target as enemy, signals future aggression |
| NEGOTIATE | Dialogue only, no stat change |
| IGNORE | Encounter ends with no effect |

---

## Deployment

- **Frontend** is deployed on [Vercel](https://vercel.com)
- **Backend** is containerized via Docker — see `backend/Dockerfile` and `.github/workflows/` for CI/CD to Azure Container Apps
