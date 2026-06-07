"""Guardrails for product/objection knowledge entries and offer scripts."""

from __future__ import annotations

import json
from pathlib import Path

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "knowledge.json"

# Spoken-output banned phrases (docs/BEHAVIORAL_PRINCIPLES.md).
BANNED_SPOKEN_PHRASES = (
    "for a company your size",
    "for companies at your scale",
    "whale account",
    "top tier",
    "big customer for us",
)

UC2_SPEND_ASK_BANNED_PHRASES = (
    "what are you spending",
    "roughly what",
    "how much you spend",
    "how much do you spend",
    "tell me your monthly spend",
    "share roughly how much",
)

OPENING_ENTRY_IDS = {
    "kb-uc1-opening",
    "kb-uc2-opening",
}

# Banned in opener example lines (docs/BEHAVIORAL_PRINCIPLES.md).
BANNED_OPENER_PHRASES = (
    "mac mini promotion",
    "a mac mini",
    "doordash credit",
    "i have an offer",
    "special offer",
)

SPOKEN_OFFER_IDS = {
    "kb-offer-uc1-enterprise",
    "kb-offer-uc1-whale",
    "kb-offer-uc2-whale",
}


def _load_knowledge() -> list[dict]:
    with KNOWLEDGE_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def test_no_behavior_entries_in_knowledge() -> None:
    """Behavior rules live in agent.py and call_signals.py, not the RAG corpus."""
    behavior_ids = [
        e["id"] for e in _load_knowledge() if e["id"].startswith("kb-behavior-")
    ]
    assert not behavior_ids, f"Remove behavior entries from knowledge.json: {behavior_ids}"


def test_spoken_offers_avoid_banned_tier_language() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    violations: list[str] = []
    for entry_id in SPOKEN_OFFER_IDS:
        text = entries[entry_id]["text"].lower()
        for phrase in BANNED_SPOKEN_PHRASES:
            if phrase in text:
                violations.append(f"{entry_id}: {phrase}")
    assert not violations, f"Banned spoken phrases found: {violations}"


def test_tier_bands_documents_internal_routing() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-tier-bands"]["text"].lower()
    assert "internal" in text or "routing" in text
    assert "never spoken" in text or "never" in text


def test_opening_entries_avoid_banned_phrases() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    violations: list[str] = []
    for entry_id in OPENING_ENTRY_IDS:
        text = entries[entry_id]["text"]
        example = text.split("Example:", 1)[-1].lower() if "Example:" in text else text.lower()
        for phrase in BANNED_OPENER_PHRASES:
            if phrase in example:
                violations.append(f"{entry_id}: {phrase}")
    assert not violations, f"Banned opener phrases found: {violations}"


def test_opening_entries_include_canonical_identity() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    for entry_id in OPENING_ENTRY_IDS:
        text = entries[entry_id]["text"].lower()
        assert "pump.co" in text
        assert "ai customer success manager" in text
        assert "alex" in text


UC2_CANONICAL_OPENER = (
    "Hey, this is Alex, an AI customer success manager calling from pump.co. "
    "I'm just calling because I saw you ran an estimate. Are there any questions "
    "that I could answer for you about pump?"
)


def test_uc2_opening_example_matches_canonical() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-uc2-opening"]["text"]
    assert UC2_CANONICAL_OPENER in text
    assert text.index("Alex") < text.index("ran an estimate")


def test_uc2_qualify_does_not_ask_spend() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-uc2-qualify"]["text"].lower()
    violations = [phrase for phrase in UC2_SPEND_ASK_BANNED_PHRASES if phrase in text]
    assert not violations, f"UC2 qualify must not ask spend: {violations}"


def test_uc2_qualify_skips_spend_question() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-uc2-qualify"]["text"].lower()
    assert "never ask" in text or "do not ask" in text or "skip" in text


def test_uc1_qualify_asks_spend() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-uc1-qualify"]["text"].lower()
    assert "monthly" in text and "spend" in text


def test_not_interested_objection_uses_wolf_persistence() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-not-interested"]["text"].lower()
    assert "wolf persistence" in text
    assert "log outcome as declined" not in text
    assert "do not log declined" in text or "do not" in text


def test_not_interested_objection_names_tier_gift() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-not-interested"]["text"].lower()
    assert "incentive nudge" in text or "thank-you gift" in text
    assert "mac mini" in text


def test_booking_progression_leads_with_tuesday_at_two() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-booking-progression"]["text"].lower()
    assert "tuesday at two" in text
    assert "what day works" in text  # forbidden open-ended ask


def test_is_ai_objection_includes_purpose_framing() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-is-ai"]["text"].lower()
    assert "programmed" in text
    assert "savings" in text
    assert "totally fair" in text


def test_send_email_objection_does_not_lead_with_happy_to_send() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-send-email"]["text"]
    lower = text.lower()
    assert "never lead with happy to send" in lower or "do not capitulate" in lower
    example = text.split("UC2 example:", 1)[-1] if "UC2 example:" in text else text
    assert "happy to send something over" not in example.lower()
    assert "10" in lower or "ten" in lower


def test_booking_progression_entry_exists() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-booking-progression"]["text"].lower()
    assert "progressive urgency" in text
    assert "today or tomorrow" in text


def test_instructions_enforce_three_sentence_cap() -> None:
    from agent import UC2_ESTIMATE_COMPLETED, _instructions_for

    text = _instructions_for(UC2_ESTIMATE_COMPLETED).lower()
    assert "three sentences" in text
    assert "four sentences" not in text
