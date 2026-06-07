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
    "kb-behavior-dnc-exit",
    "kb-behavior-wolf-persistence",
    "kb-behavior-talkover-yield",
    "kb-behavior-active-listening",
    "kb-behavior-ai-identity-philosophy",
    "kb-behavior-meeting-value-selling",
    "kb-behavior-four-sentence-cap",
    "kb-behavior-estimate-aware-qualify",
    "kb-behavior-savings-not-spend",
    "kb-behavior-same-turn-demo-bridge",
}

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


def test_uc2_qualify_does_not_ask_spend() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-uc2-qualify"]["text"].lower()
    violations = [phrase for phrase in UC2_SPEND_ASK_BANNED_PHRASES if phrase in text]
    assert not violations, f"UC2 qualify must not ask spend: {violations}"


def test_uc2_qualify_skips_spend_question() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-flow-uc2-qualify"]["text"].lower()
    assert "never ask" in text or "do not ask" in text or "skip" in text


def test_savings_not_spend_entry_bans_verbalizing_spend() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-savings-not-spend"]["text"].lower()
    assert "never" in text
    assert "spend" in text
    assert "annual savings" in text or "savings" in text


def test_direct_answering_mentions_demo_and_free_trial() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-direct-answering"]["text"].lower()
    assert "demo" in text
    assert "free trial" in text


def test_estimate_aware_qualify_entry_covers_uc1_and_uc2() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-estimate-aware-qualify"]["text"].lower()
    assert "uc2" in text or "estimate" in text
    assert "uc1" in text or "signup" in text or "account" in text
    assert "never ask" in text or "do not ask" in text


def test_same_turn_demo_bridge_entry_exists() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-same-turn-demo-bridge"]["text"].lower()
    assert "same" in text or "same turn" in text
    assert "demo" in text


def test_not_interested_objection_uses_wolf_persistence() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-not-interested"]["text"].lower()
    assert "wolf persistence" in text
    assert "log outcome as declined" not in text
    assert "do not log declined" in text or "do not" in text


def test_wolf_persistence_entry_never_self_hangup() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-wolf-persistence"]["text"].lower()
    assert "never" in text
    assert "booked" in text or "do-not-call" in text


def test_talkover_yield_entry_mentions_ad_libs() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-talkover-yield"]["text"].lower()
    assert "twice" in text
    assert "totally hear you" in text or "i got it" in text
    assert "no pitching" in text or "no pitch" in text


def test_active_listening_entry_has_phrase_bank() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-active-listening"]["text"].lower()
    assert "totally hear you" in text
    assert "i understand where you're coming from" in text
    assert "warm" in text or "tasteful" in text


def test_ai_identity_philosophy_forbids_human_mimicry() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-ai-identity-philosophy"]["text"].lower()
    assert "never" in text
    assert "pretend" in text or "human" in text
    assert "programmed" in text or "follow-up" in text or "follow up" in text
    assert "defensive" in text


def test_is_ai_objection_includes_purpose_framing() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-is-ai"]["text"].lower()
    assert "programmed" in text
    assert "savings" in text
    assert "totally fair" in text


def test_meeting_value_selling_entry_covers_pillars() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-behavior-meeting-value-selling"]["text"].lower()
    assert "10" in text or "ten" in text
    assert "30" in text or "thirty" in text
    assert "enforcing" in text
    assert "savings" in text
    assert "what do you have to lose" in text or "pay" in text
    assert "thought leadership" in text or "built the tool" in text


def test_send_email_objection_does_not_lead_with_happy_to_send() -> None:
    entries = {e["id"]: e for e in _load_knowledge()}
    text = entries["kb-obj-send-email"]["text"]
    lower = text.lower()
    assert "never lead with happy to send" in lower or "do not capitulate" in lower
    example = text.split("UC2 example:", 1)[-1] if "UC2 example:" in text else text
    assert "happy to send something over" not in example.lower()
    assert "10" in lower or "ten" in lower
