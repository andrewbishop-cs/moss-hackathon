"""Guardrails for behavioral knowledge entries and offer scripts."""

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

BEHAVIOR_ENTRY_IDS = {
    "kb-behavior-savings-centric-selling",
    "kb-behavior-incentive-nudge",
    "kb-behavior-internal-tiers-private",
    "kb-behavior-weak-agreement",
    "kb-behavior-scheduling-recovery",
    "kb-behavior-conversational-persistence",
    "kb-behavior-opener-short-conversational",
    "kb-behavior-direct-answering",
    "kb-behavior-hard-stop-exit",
    "kb-behavior-four-sentence-cap",
}

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

# Offer/spoken entries updated for internal-tiers principle.
SPOKEN_OFFER_IDS = {
    "kb-offer-uc1-enterprise",
    "kb-offer-uc1-whale",
    "kb-offer-uc2-whale",
    "kb-spoken-michael-whale",
}


def _load_knowledge() -> list[dict]:
    with KNOWLEDGE_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def test_behavior_entries_exist() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    missing = BEHAVIOR_ENTRY_IDS - entries.keys()
    assert not missing, f"Missing kb-behavior entries: {missing}"


def test_spoken_offers_avoid_banned_tier_language() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    violations: list[str] = []
    for entry_id in SPOKEN_OFFER_IDS:
        text = entries[entry_id]["text"].lower()
        for phrase in BANNED_SPOKEN_PHRASES:
            if phrase in text:
                violations.append(f"{entry_id}: {phrase}")
    assert not violations, f"Banned spoken phrases found: {violations}"


def test_internal_tiers_entry_documents_evaluation_framing() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-internal-tiers-private"]["text"].lower()
    assert "evaluation" in text
    assert "whale" in text  # documents what not to say


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
