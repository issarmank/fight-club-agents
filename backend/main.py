from __future__ import annotations
import asyncio
import json
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from agents.personalities import create_agents
from game.grid import GameState, GRID_WIDTH, GRID_HEIGHT
from game.tick import TickManager
from events.handler import EventHandler

connected_clients: set[WebSocket] = set()
game_state: GameState | None = None
event_handler: EventHandler | None = None


async def broadcast(message: dict) -> None:
    if not connected_clients:
        return
    data = json.dumps(message)
    dead: set[WebSocket] = set()
    for ws in connected_clients:
        try:
            await ws.send_text(data)
        except Exception:
            dead.add(ws)
    connected_clients -= dead


@asynccontextmanager
async def lifespan(app: FastAPI):
    global game_state, event_handler

    agents = create_agents(GRID_WIDTH, GRID_HEIGHT)
    game_state = GameState(agents)
    event_handler = EventHandler(game_state, broadcast)

    asyncio.create_task(
        TickManager(game_state, event_handler.queue, broadcast).run()
    )
    asyncio.create_task(event_handler.run())

    yield


app = FastAPI(title="Fight Club Agents", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "tick": game_state.tick_count if game_state else 0}


@app.get("/agents")
async def get_agents():
    if not game_state:
        return []
    return [a.to_dict() for a in game_state.agents]


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.add(ws)

    # Send current state immediately on connect
    if game_state:
        await ws.send_text(json.dumps(game_state.to_dict()))

    try:
        while True:
            # Keep the connection alive; client can send pings
            await ws.receive_text()
    except WebSocketDisconnect:
        connected_clients.discard(ws)
    except Exception:
        connected_clients.discard(ws)
