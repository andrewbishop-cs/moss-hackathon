"""Rule-based booking signal detection for Alex outbound calls.

Classifies prospect utterances as weak agreement, strong buying intent, or
positive curiosity so the agent can reinforce value before hard-closing.
See docs/BEHAVIORAL_PRINCIPLES.md for canonical coaching rules.
"""

from __future__ import annotations

import re
from typing import Literal

SignalKind = Literal["weak_agreement", "strong_intent", "positive_curiosity", "none"]
InterestLevel = Literal["cold", "warming", "ready"]

INTEREST_COLD_MAX = 1
INTEREST_READY_MIN = 4

INTEREST_DELTA_STRONG_INTENT = 3
INTEREST_DELTA_POSITIVE_CURIOSITY = 2
INTEREST_DELTA_WEAK_AGREEMENT = 1
INTEREST_DELTA_SOFT_OBJECTION = -2
INTEREST_DELTA_MEETING_DEFERRAL = -2
INTEREST_DELTA_TIME_REJECTION = -1

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

# Explicit do-not-call — the only scenario where Alex surrenders (BEHAVIORAL_PRINCIPLES.md).
DNC_PHRASES = (
    "take me off your list",
    "remove me from your list",
    "stop calling",
    "don't call",
    "do not call",
    "don't call me",
    "don't call me again",
    "do not call me again",
)

# Soft objections — wolf persistence: rebuild interest, never self-hangup.
SOFT_OBJECTION_PHRASES = (
    "i'm not interested",
    "not interested",
    "not down",
    "leave me alone",
    "i'm good",
    "i am good",
    "don't need help",
    "do not need help",
    "don't need any help",
    "i need to go",
    "got to go",
    "have to go",
)

MEETING_DEFERRAL_PHRASES = (
    "send me an email",
    "just email",
    "email me",
    "send something over",
    "send it over",
    "send me info",
    "send me the info",
    "on my own time",
    "research it myself",
    "look into it",
    "look into it myself",
    "not comfortable",
    "weird sales",
    "back and forth in ai",
    "go back and forth in ai",
    "don't want a call",
    "do not want a call",
    "don't want to do a call",
    "not doing a demo",
    "no meeting",
    "no call",
)

MEETING_VALUE_HINT = (
    "MEETING VALUE — prospect deferred from a call. Listen first. "
    "Do NOT loop calendar asks. Call search_knowledge for product info "
    "(how Pump works, savings, free, no lock-in) and give 1-2 substantive "
    "sentences before any meeting bridge. Soft product question last — not "
    "hard calendar close on first deferral."
)

INTEREST_COLD_HINT = (
    "INTEREST COLD — score too low for a meeting ask. Educate and answer "
    "product questions via search_knowledge. Forbidden: proposing specific "
    "times, would Thursday work, or hard calendar close."
)

INTEREST_WARMING_HINT = (
    "INTEREST WARMING — soft bridge only. Open to a walkthrough or quick "
    "look is OK — no specific times or hard calendar close yet."
)

INTEREST_READY_HINT = (
    "INTEREST READY — threshold met. Meeting-value pillars and scheduling "
    "are permitted if appropriate."
)

_TIME_REJECTION_PHRASES = frozenset(
    {"no", "nope", "not really", "can't", "cannot"}
)

OBJECTION_RECOVERY_HINT = (
    "WOLF PERSISTENCE — prospect pushed back but did NOT opt out of all contact. "
    "Do NOT say goodbye, do NOT log declined, do NOT stop talking. "
    "Acknowledge briefly, rebuild interest with their savings number + proof + ease, "
    "name their tier thank-you gift as incentive nudge, end with a question. "
    "Call search_knowledge for not-interested objection first."
)

DNC_EXIT_HINT = (
    "EXPLICIT DNC — prospect requested do-not-call. Acknowledge you will add them "
    "to the do-not-call list, one brief goodbye, immediately log_outcome declined."
)

# Backward-compatible alias for tests and agent safety net.
HARD_STOP_HINT = DNC_EXIT_HINT

COACHING_HINTS: dict[SignalKind, str] = {
    "weak_agreement": (
        "Prospect gave weak agreement — not commitment. Respond positively "
        "(e.g. Awesome), reinforce savings + ease + proof, then propose "
        "Tuesday at two for a quick demo. Do not ask open-ended what day "
        "works. Do not treat as booked until time confirmed."
    ),
    "positive_curiosity": (
        "Prospect showed positive curiosity — move subtly toward a meeting. "
        "Reinforce savings and implementation ease first, then make the demo "
        "feel like the natural way to validate the savings."
    ),
    "strong_intent": (
        "Prospect showed strong buying signals — briefly confirm value, then "
        "propose Tuesday at two for a quick demo. Keep savings as the primary "
        "reason; incentive only as a brief nudge if needed."
    ),
    "none": "",
}

REBUILD_INTEREST_HINT = (
    "Prospect rejected two proposed times — stop proposing calendar slots. "
    "Rebuild interest with savings, ease, implementation, and proof. After "
    "value is reinforced, try scheduling again. Keep rebuilding — never "
    "self-exit on scheduling failure."
)

ACTIVE_LISTENING_PHRASES = (
    "totally hear you",
    "i understand where you're coming from",
    "yep",
    "i got it",
    "i know what you mean",
    "mm-hmm",
    "that makes sense",
    "fair enough",
)

TALKOVER_ONCE_HINT = (
    "Talked over once — reclaim the floor once politely "
    "(e.g. Totally, the quick thing I wanted to mention is…), then finish your point."
)

TALKOVER_YIELD_HINT = (
    "Talked over twice — yield the floor. Use brief active-listening ad-libs only: "
    "Totally hear you, I got it, Yep, I know what you mean, I understand where "
    "you're coming from. One short phrase at a time. Do NOT pitch, ask questions, "
    "or reclaim your previous point until the prospect finishes speaking."
)


def _normalize(text: str) -> str:
    lowered = text.strip().lower()
    stripped = re.sub(r"[^\w\s']", " ", lowered)
    return re.sub(r"\s+", " ", stripped).strip()


def _matches_short_phrase(normalized: str, phrases: tuple[str, ...]) -> bool:
    tokens = normalized.rstrip(".!?").split()
    if len(tokens) > 4:
        return False
    return any(
        normalized == phrase or normalized.startswith(f"{phrase} ")
        for phrase in phrases
    )


def is_dnc_request(text: str) -> bool:
    """True when prospect explicitly requests do-not-call — Alex's only surrender."""
    normalized = _normalize(text)
    if not normalized:
        return False
    return any(phrase in normalized for phrase in DNC_PHRASES)


def is_meeting_deferral(text: str) -> bool:
    """True when prospect defers to email, self-research, or privacy discomfort."""
    normalized = _normalize(text)
    if not normalized or is_dnc_request(text):
        return False
    return any(phrase in normalized for phrase in MEETING_DEFERRAL_PHRASES)


def is_soft_objection(text: str) -> bool:
    """True when prospect pushes back but has not opted out of all contact."""
    normalized = _normalize(text)
    if not normalized or is_dnc_request(text):
        return False
    if any(phrase in normalized for phrase in SOFT_OBJECTION_PHRASES):
        return True
    return _matches_short_phrase(normalized, ("no thanks", "no thank you"))


def is_hard_stop(text: str) -> bool:
    """Backward-compatible alias — True only for explicit DNC requests."""
    return is_dnc_request(text)


def interest_delta_for(text: str) -> int:
    """Return the interest score change for a prospect utterance."""
    if is_dnc_request(text):
        return 0
    if is_meeting_deferral(text):
        return INTEREST_DELTA_MEETING_DEFERRAL
    if is_soft_objection(text):
        return INTEREST_DELTA_SOFT_OBJECTION
    normalized = _normalize(text)
    if normalized.rstrip(".!?") in _TIME_REJECTION_PHRASES:
        return INTEREST_DELTA_TIME_REJECTION
    kind = classify_prospect_utterance(text)
    if kind == "strong_intent":
        return INTEREST_DELTA_STRONG_INTENT
    if kind == "positive_curiosity":
        return INTEREST_DELTA_POSITIVE_CURIOSITY
    if kind == "weak_agreement":
        return INTEREST_DELTA_WEAK_AGREEMENT
    return 0


def interest_level(score: int) -> InterestLevel:
    """Map cumulative interest score to cold / warming / ready."""
    if score >= INTEREST_READY_MIN:
        return "ready"
    if score > INTEREST_COLD_MAX:
        return "warming"
    return "cold"


def interest_coaching_hint(
    score: int, *, utterance_kind: SignalKind = "none"
) -> str | None:
    """Return interest-threshold coaching based on cumulative score."""
    if utterance_kind == "strong_intent":
        return INTEREST_READY_HINT
    level = interest_level(score)
    if level == "cold":
        return INTEREST_COLD_HINT
    if level == "warming":
        return INTEREST_WARMING_HINT
    return None


def classify_prospect_utterance(text: str) -> SignalKind:
    """Return the strongest matching booking signal for a prospect utterance."""
    normalized = _normalize(text)
    if not normalized or is_dnc_request(text):
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


def next_talkover_count(current: int, *, was_interrupted: bool) -> int:
    """Increment on interruption; reset to zero on a clean completed turn."""
    if was_interrupted:
        return current + 1
    return 0


def talkover_coaching_hint(consecutive_talkovers: int) -> str | None:
    """Return talk-over coaching after agent speech ends, if any."""
    if consecutive_talkovers == 1:
        return TALKOVER_ONCE_HINT
    if consecutive_talkovers >= 2:
        return TALKOVER_YIELD_HINT
    return None


def _combine_hints(*hints: str | None) -> str | None:
    parts = [h for h in hints if h]
    return " ".join(parts) if parts else None


def coaching_hint_for(
    text: str, *, rejected_times: int = 0, interest_score: int = 0
) -> str | None:
    """Return coaching hint(s) to inject into the agent prompt, if any."""
    if is_dnc_request(text):
        return DNC_EXIT_HINT
    if is_meeting_deferral(text):
        return MEETING_VALUE_HINT
    if is_soft_objection(text):
        return OBJECTION_RECOVERY_HINT
    if rejected_times >= 2:
        return REBUILD_INTEREST_HINT

    kind = classify_prospect_utterance(text)
    signal_hint = COACHING_HINTS.get(kind, "") or None
    threshold_hint = interest_coaching_hint(interest_score, utterance_kind=kind)
    return _combine_hints(threshold_hint, signal_hint)
