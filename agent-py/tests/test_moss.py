"""Unit tests for the agent's Moss-backed and outcome tools.

Unlike the LLM-judged evals in `test_agent.py`, these are deterministic unit
tests that exercise the tool methods directly. They stub `MossClient` via
monkeypatch so they run with no Moss credentials and no network access — the
live, credentialed behavior is validated by re-indexing and a console run.
"""

import json

import pytest

import agent as agent_module
from agent import Assistant

LEAD_ID = "lead-uc2-sarah"


class _FakeDoc:
    """Stand-in for a Moss query-result document (`.text/.score/.metadata`)."""

    def __init__(self, text: str, score=None, metadata=None) -> None:
        self.text = text
        self.score = score
        self.metadata = metadata


class _FakeSearchResult:
    """Stand-in for a Moss `SearchResult` (`.docs/.time_taken_ms`)."""

    def __init__(self, docs, time_taken_ms: float = 12.5) -> None:
        self.docs = docs
        self.time_taken_ms = time_taken_ms


class _FakeMossClient:
    """Records calls instead of contacting Moss. Substituted for `MossClient`.

    `MossClient(project_id, project_key)` is constructed inside
    `Assistant.__init__`, so each Assistant gets its own instance, reachable in
    tests as `assistant._moss`.
    """

    def __init__(self, *args, **kwargs) -> None:
        self.load_index_calls: list[str] = []
        self.query_calls: list[tuple] = []
        self.add_docs_calls: list[tuple] = []
        # Default empty result; tests override before invoking a tool.
        self.query_result = _FakeSearchResult([])

    async def load_index(self, name, *args, **kwargs):
        self.load_index_calls.append(name)

    async def query(self, index, query, options=None):
        self.query_calls.append((index, query, options))
        return self.query_result

    async def add_docs(self, index, docs, options=None):
        self.add_docs_calls.append((index, docs, options))
        return None


class _FakePublisher:
    def __init__(self) -> None:
        self.published: list[tuple] = []

    async def publish_data(self, payload, reliable=None):
        self.published.append((payload, reliable))


class _FakeRoom:
    def __init__(self) -> None:
        self.local_participant = _FakePublisher()


@pytest.fixture
def stub_moss(monkeypatch):
    """Replace the agent's `MossClient` with the recording fake."""
    monkeypatch.setattr(agent_module, "MossClient", _FakeMossClient)


async def test_search_knowledge_returns_joined_text_and_publishes_context(
    stub_moss,
) -> None:
    """search_knowledge joins snippets and publishes a well-formed payload."""
    room = _FakeRoom()
    assistant = Assistant(room=room, lead_id=LEAD_ID)
    assistant._moss.query_result = _FakeSearchResult(
        [
            _FakeDoc(
                "Pump cuts your AWS bill.", score=0.9, metadata={"category": "product"}
            ),
            _FakeDoc("No credit card required.", score=0.8),
        ],
        time_taken_ms=7.0,
    )

    result = await assistant.search_knowledge(None, "how does pump work?")

    # Returns the snippets joined as plain text.
    assert result == "Pump cuts your AWS bill.\n\nNo credit card required."

    # Queried the knowledge (RAG) index with the user's query.
    assert len(assistant._moss.query_calls) == 1
    index, query, options = assistant._moss.query_calls[0]
    assert index == agent_module.KNOWLEDGE_INDEX
    assert query == "how does pump work?"
    assert options.top_k == 5

    # Published exactly one moss_context message, reliably.
    assert len(room.local_participant.published) == 1
    payload_bytes, reliable = room.local_participant.published[0]
    assert reliable is True

    payload = json.loads(payload_bytes.decode("utf-8"))
    assert payload["type"] == "moss_context"
    data = payload["data"]
    # Contractual keys consumed by the frontend parser.
    assert set(data) == {"query", "matches", "time_taken_ms", "timestamp"}
    assert data["time_taken_ms"] == 7.0
    assert isinstance(data["timestamp"], (int, float))

    matches = data["matches"]
    assert len(matches) == 2
    assert matches[0]["text"] == "Pump cuts your AWS bill."
    assert matches[0]["score"] == 0.9
    assert matches[0]["metadata"] == {"category": "product"}


async def test_get_lead_context_filters_by_lead_id(stub_moss) -> None:
    """get_lead_context scopes the leads query to this call's lead_id."""
    room = _FakeRoom()
    assistant = Assistant(room=room, lead_id=LEAD_ID)
    assistant._moss.query_result = _FakeSearchResult(
        [
            _FakeDoc(
                "Sarah Chen ran an estimate showing $13,240/month in savings.",
                metadata={"lead_id": LEAD_ID, "name": "Sarah Chen"},
            ),
        ]
    )

    result = await assistant.get_lead_context(None)

    # Returns the lead's profile text.
    assert "Sarah Chen" in result
    assert "13,240" in result

    # Queried the leads index, pinned to this lead via a metadata filter.
    assert len(assistant._moss.query_calls) == 1
    index, _query, options = assistant._moss.query_calls[0]
    assert index == agent_module.LEADS_INDEX
    assert options.filter == {
        "field": "lead_id",
        "condition": {"$eq": LEAD_ID},
    }

    # Surfaces context to the frontend panel.
    assert len(room.local_participant.published) == 1


async def test_get_lead_context_handles_missing_lead(stub_moss) -> None:
    """With no matching lead doc, get_lead_context returns a graceful message."""
    assistant = Assistant(lead_id="lead-does-not-exist")
    assistant._moss.query_result = _FakeSearchResult([])

    result = await assistant.get_lead_context(None)
    assert isinstance(result, str) and result


async def test_book_meeting_returns_confirmation(stub_moss) -> None:
    """book_meeting acknowledges the booking (stub: no external side effects yet)."""
    assistant = Assistant(lead_id=LEAD_ID)
    result = await assistant.book_meeting(None)
    assert isinstance(result, str) and result


async def test_log_outcome_returns_ack(stub_moss) -> None:
    """log_outcome records the call result and acknowledges."""
    assistant = Assistant(lead_id=LEAD_ID)
    result = await assistant.log_outcome(None, "booked")
    assert isinstance(result, str) and result
