from __future__ import annotations
import asyncio
import os
import uuid
from functools import partial
from typing import Optional

_pc = None
_index = None

INDEX_NAME = "fight-club-memories"
EMBED_MODEL = "multilingual-e5-large"
EMBED_DIM = 1024


def _get_pc():
    global _pc
    if _pc is None:
        from pinecone import Pinecone
        _pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    return _pc


def init_pinecone() -> None:
    """Create the index if it doesn't exist and cache the handle. Call once at startup."""
    global _index
    pc = _get_pc()

    existing = [idx.name for idx in pc.list_indexes()]
    if INDEX_NAME not in existing:
        from pinecone import ServerlessSpec
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    _index = pc.Index(INDEX_NAME)


def _embed(texts: list[str], input_type: str) -> list[list[float]]:
    pc = _get_pc()
    result = pc.inference.embed(
        model=EMBED_MODEL,
        inputs=texts,
        parameters={"input_type": input_type, "truncate": "END"},
    )
    return [r.values for r in result]


def _store_sync(agent_id: str, text: str, tick: int) -> None:
    if _index is None:
        return
    vectors = _embed([text], "passage")
    _index.upsert(
        vectors=[{
            "id": f"{agent_id}_{uuid.uuid4().hex[:8]}",
            "values": vectors[0],
            "metadata": {"text": text, "tick": tick},
        }],
        namespace=agent_id,
    )


def _recall_sync(agent_id: str, query: str, top_k: int = 5) -> list[str]:
    if _index is None:
        return []
    vectors = _embed([query], "query")
    results = _index.query(
        namespace=agent_id,
        vector=vectors[0],
        top_k=top_k,
        include_metadata=True,
    )
    return [m.metadata["text"] for m in results.matches if m.metadata.get("text")]


async def store_memory(agent_id: str, text: str, tick: int) -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_store_sync, agent_id, text, tick))


async def recall_memories(agent_id: str, query: str, top_k: int = 5) -> list[str]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_recall_sync, agent_id, query, top_k))


def is_configured() -> bool:
    return bool(os.environ.get("PINECONE_API_KEY"))
