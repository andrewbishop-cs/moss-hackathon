"""Build the Moss indexes used by this voice agent.

Creates two indexes from the credentials in ``agent-py/.env.local``:

* the static ``knowledge`` index (RAG corpus of Pump product / offer / objection
  facts), seeded from ``agent-py/knowledge.json``
* the ``leads`` index (one document per lead, tagged with ``lead_id`` metadata),
  seeded from ``agent-py/leads.json`` for local dev. In production this index is
  populated from Supabase before each call instead.

Run from the repo root via ``pnpm moss:index`` (which invokes
``uv --directory agent-py run src/create_index.py``) once Moss credentials are set.
This script needs ``MOSS_PROJECT_ID`` / ``MOSS_PROJECT_KEY`` to run; without them it
exits with a clear message instead of contacting Moss.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from moss import DocumentInfo, MossClient

# Resolve paths relative to this file so the script works regardless of the
# current working directory. ``src/create_index.py`` -> parent.parent == agent-py/.
AGENT_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_PATH = AGENT_DIR / "knowledge.json"
LEADS_PATH = AGENT_DIR / "leads.json"
ENV_PATH = AGENT_DIR / ".env.local"

DEFAULT_MODEL_ID = "moss-minilm"
DEFAULT_KNOWLEDGE_INDEX = "knowledge"
DEFAULT_LEADS_INDEX = "leads"

# Load environment variables from agent-py/.env.local.
load_dotenv(ENV_PATH)


def _load_documents(path: Path, label: str) -> list[DocumentInfo]:
    """Load a ``{id, text, metadata}`` JSON list into Moss DocumentInfo entries."""
    if not path.exists():
        raise FileNotFoundError(f"{label} data file not found at {path}.")

    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, list):
        raise ValueError(f"{path.name} must be a list of document entries.")

    documents: list[DocumentInfo] = []
    for entry in data:
        if not isinstance(entry, dict):
            continue
        doc_id = entry.get("id")
        text = entry.get("text")
        if not doc_id or not text:
            continue
        metadata = entry.get("metadata")
        if not isinstance(metadata, dict):
            metadata = {}
        # Moss metadata values must be strings.
        metadata = {str(k): str(v) for k, v in metadata.items()}
        documents.append(DocumentInfo(id=str(doc_id), text=str(text), metadata=metadata))

    if not documents:
        raise ValueError(f"No valid documents were loaded from {path.name}.")

    return documents


async def build_indexes() -> None:
    project_id = os.getenv("MOSS_PROJECT_ID")
    project_key = os.getenv("MOSS_PROJECT_KEY")
    knowledge_index = os.getenv("MOSS_INDEX_NAME", DEFAULT_KNOWLEDGE_INDEX)
    leads_index = os.getenv("MOSS_LEADS_INDEX_NAME", DEFAULT_LEADS_INDEX)
    model_id = os.getenv("MOSS_MODEL_ID", DEFAULT_MODEL_ID)

    missing = [
        name
        for name, value in {
            "MOSS_PROJECT_ID": project_id,
            "MOSS_PROJECT_KEY": project_key,
        }.items()
        if not value
    ]
    if missing:
        raise OSError(
            "Missing required Moss environment variables: "
            + ", ".join(missing)
            + f". Set them in {ENV_PATH} before running this script."
        )

    assert project_id is not None
    assert project_key is not None

    knowledge_docs = _load_documents(KNOWLEDGE_PATH, "Knowledge")
    leads_docs = _load_documents(LEADS_PATH, "Leads")

    client = MossClient(project_id, project_key)

    # Moss caps the number of indexes per project, and create_index always makes a
    # NEW index, so re-running would hit "Index limit reached". Delete first to make
    # this script idempotent: each run rebuilds both indexes from the current JSON.
    existing = {ix.name for ix in await client.list_indexes()}
    for name in (knowledge_index, leads_index):
        if name in existing:
            print(f"Deleting existing index '{name}' before rebuild...")
            await client.delete_index(name)

    print(
        f"Creating Moss knowledge index '{knowledge_index}' with "
        f"{len(knowledge_docs)} docs using model '{model_id}'..."
    )
    knowledge_result = await client.create_index(knowledge_index, knowledge_docs, model_id)
    print(
        f"  done (job: {knowledge_result.job_id}, index: {knowledge_result.index_name}, "
        f"docs: {knowledge_result.doc_count})"
    )

    print(
        f"Creating Moss leads index '{leads_index}' with "
        f"{len(leads_docs)} docs using model '{model_id}'..."
    )
    leads_result = await client.create_index(leads_index, leads_docs, model_id)
    print(
        f"  done (job: {leads_result.job_id}, index: {leads_result.index_name}, "
        f"docs: {leads_result.doc_count})"
    )

    print("Both Moss indexes rebuilt. Knowledge (RAG) and leads are ready for use.")


if __name__ == "__main__":
    asyncio.run(build_indexes())
