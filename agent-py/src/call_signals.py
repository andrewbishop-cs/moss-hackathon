"""Rule-based booking signal detection for Alex outbound calls.

Classifies prospect utterances as weak agreement, strong buying intent, or
positive curiosity so the agent can reinforce value before hard-closing.
See docs/BEHAVIORAL_PRINCIPLES.md for canonical coaching rules.
"""

from __future__ import annotations

import re
from typing import Literal

SignalKind = Literal["weak_agreement", "strong_intent", "positive_curiosity", "none"]

WEAK_AGREEMENT_PHRASES = (
    "sure",
    "okay",
    "ok",
    "i guess",
    "maybe",
    "i don't know",
    "sounds fine",
    "yeah sure",
    "uh huh",
    "fine",
)

POSITIVE_CURIOSITY_PHRASES = (
    "that's a lot of money",
    "interesting",
    "how does that work",
    "tell me more",
    "what's the catch",
    "how long does setup take",
    "how long does onboarding take",
    "what about onboarding",
    "what about implementation",
    "how does implementation work",
    "what about security",
    "is it safe",
    "how much does it cost",
    "how much does pump cost",
    "who else uses",
    "who else uses this",
    "who are your customers",
    "who uses pump",
    "that sounds useful",
)

STRONG_INTENT_PHRASES = (
    "how does pump work",
    "how do you work",
    "what about setup",
    "show me",
    "walk me through",
    "open to looking at times",
    "let's book",
    "schedule",
    "calendar",
    "demo",
)

# Conversational persistence must not override these (BEHAVIORAL_PRINCIPLES.md).
HARD_STOP_PHRASES = (
    "i'm not interested",
    "not interested",
    "take me off your list",
    "remove me from your list",
    "stop calling",
    "don't call",
    "do not call",
    "i need to go",
    "got to go",
    "have to go",
)

COACHING_HINTS: dict[SignalKind, str] = {
    "weak_agreement": (
        "Prospect gave weak agreement — not commitment. Respond positively "
        "(e.g. Awesome), reinforce savings + ease + proof, then continue "
        "toward scheduling. Do not treat as booked."
    ),
    "positive_curiosity": (
        "Prospect showed positive curiosity — move subtly toward a meeting. "
        "Reinforce savings and implementation ease first, then make the demo "
        "feel like the natural way to validate the savings."
    ),
    "strong_intent": (
        "Prospect showed strong buying signals — briefly confirm value, then "
        "guide toward booking. Keep savings as the primary reason; incentive "
        "only as a brief nudge if needed."
    ),
    "none": "",
}

REBUILD_INTEREST_HINT = (
    "Prospect rejected two proposed times — stop proposing calendar slots. "
    "Rebuild interest with savings, ease, implementation, and proof. After "
    "value is reinforced, try scheduling again. Three full rebuild cycles "
    "then exit gracefully."
)


def _normalize(text: str) -> str:
    lowered = text.strip().lower()
    stripped = re.sub(r"[^\w\s']", " ", lowered)
    return re.sub(r"\s+", " ", stripped).strip()


def is_hard_stop(text: str) -> bool:
    """True when Alex must not persist or push scheduling (opt-out / hard no)."""
    normalized = _normalize(text)
    if not normalized:
        return False
    return any(phrase in normalized for phrase in HARD_STOP_PHRASES)


def classify_prospect_utterance(text: str) -> SignalKind:
    """Return the strongest matching booking signal for a prospect utterance."""
    normalized = _normalize(text)
    if not normalized or is_hard_stop(normalized):
        return "none"

    if any(phrase in normalized for phrase in STRONG_INTENT_PHRASES):
        return "strong_intent"

    if any(phrase in normalized for phrase in POSITIVE_CURIOSITY_PHRASES):
        return "positive_curiosity"

    # Weak agreement: short affirmatives without stronger intent cues.
    tokens = normalized.rstrip(".!?").split()
    if len(tokens) <= 6 and any(
        normalized == phrase or normalized.startswith(f"{phrase} ")
        for phrase in WEAK_AGREEMENT_PHRASES
    ):
        return "weak_agreement"

    return "none"


def coaching_hint_for(text: str, *, rejected_times: int = 0) -> str | None:
    """Return a one-line coaching hint to inject into the agent prompt, if any."""
    if is_hard_stop(text):
        return None
    if rejected_times >= 2:
        return REBUILD_INTEREST_HINT
    kind = classify_prospect_utterance(text)
    hint = COACHING_HINTS.get(kind, "")
    return hint or None
