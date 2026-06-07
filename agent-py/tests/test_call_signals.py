from call_signals import (
    ACTIVE_LISTENING_PHRASES,
    DNC_EXIT_HINT,
    MEETING_VALUE_HINT,
    OBJECTION_RECOVERY_HINT,
    REBUILD_INTEREST_HINT,
    TALKOVER_ONCE_HINT,
    TALKOVER_YIELD_HINT,
    classify_prospect_utterance,
    coaching_hint_for,
    is_dnc_request,
    is_hard_stop,
    is_meeting_deferral,
    is_soft_objection,
    next_talkover_count,
    talkover_coaching_hint,
)


def test_weak_agreement() -> None:
    assert classify_prospect_utterance("Yeah, sure.") == "weak_agreement"
    assert classify_prospect_utterance("Okay") == "weak_agreement"
    assert classify_prospect_utterance("Fine") == "weak_agreement"
    assert coaching_hint_for("I guess") is not None
    assert "not commitment" in coaching_hint_for("I guess") or "not booked" in coaching_hint_for("I guess")


def test_positive_curiosity() -> None:
    assert (
        classify_prospect_utterance("That's a lot of money.")
        == "positive_curiosity"
    )
    assert classify_prospect_utterance("How does that work?") == "positive_curiosity"
    assert (
        classify_prospect_utterance("What about onboarding?")
        == "positive_curiosity"
    )
    assert (
        classify_prospect_utterance("How much does Pump cost?")
        == "positive_curiosity"
    )
    assert (
        classify_prospect_utterance("Who are your customers?")
        == "positive_curiosity"
    )


def test_strong_intent() -> None:
    assert classify_prospect_utterance("Can we schedule a demo?") == "strong_intent"
    assert (
        classify_prospect_utterance("Who else uses Pump?") == "positive_curiosity"
    )


def test_neutral() -> None:
    assert classify_prospect_utterance("We're busy this quarter.") == "none"
    assert coaching_hint_for("We're busy this quarter.") is None


def test_soft_objection_injects_recovery_hint() -> None:
    assert is_soft_objection("I'm not interested, thanks.")
    assert is_soft_objection("No thanks")
    assert is_soft_objection("I'm not down for a spam call")
    assert is_soft_objection("I need to go")
    assert not is_dnc_request("I'm not interested")
    assert not is_hard_stop("I'm not interested")
    assert classify_prospect_utterance("I'm not interested") == "none"
    hint = coaching_hint_for("I'm not interested")
    assert hint == OBJECTION_RECOVERY_HINT
    assert "wolf persistence" in hint.lower()
    assert "do not log declined" in hint.lower()


def test_meeting_deferral_injects_hint() -> None:
    assert is_meeting_deferral("Just email me the details.")
    assert is_meeting_deferral("I'm not comfortable sharing that.")
    assert is_meeting_deferral("I'll research it myself on my own time.")
    hint = coaching_hint_for("Just send me an email instead.")
    assert hint == MEETING_VALUE_HINT
    assert "meeting value" in hint.lower()
    assert "do not offer email" in hint.lower()


def test_dnc_injects_exit_hint() -> None:
    assert is_dnc_request("Take me off your list")
    assert is_dnc_request("Stop calling me")
    assert is_hard_stop("Stop calling me")
    assert not is_soft_objection("Take me off your list")
    hint = coaching_hint_for("Take me off your list")
    assert hint == DNC_EXIT_HINT
    assert "declined" in hint.lower()
    assert "do-not-call" in hint.lower()


def test_rejected_times_triggers_rebuild_hint() -> None:
    hint = coaching_hint_for("We're busy this quarter.", rejected_times=2)
    assert hint == REBUILD_INTEREST_HINT
    assert "rebuild" in hint.lower()
    assert "never self-exit" in hint.lower()


def test_talkover_count_increments_on_interrupt() -> None:
    assert next_talkover_count(0, was_interrupted=True) == 1
    assert next_talkover_count(1, was_interrupted=True) == 2


def test_talkover_count_resets_on_clean_turn() -> None:
    assert next_talkover_count(2, was_interrupted=False) == 0
    assert next_talkover_count(0, was_interrupted=False) == 0


def test_talkover_once_hint_at_one() -> None:
    assert talkover_coaching_hint(1) == TALKOVER_ONCE_HINT
    assert "reclaim" in TALKOVER_ONCE_HINT.lower()


def test_talkover_yield_hint_at_two_or_more() -> None:
    assert talkover_coaching_hint(2) == TALKOVER_YIELD_HINT
    assert talkover_coaching_hint(3) == TALKOVER_YIELD_HINT
    assert "totally hear you" in TALKOVER_YIELD_HINT.lower()
    assert talkover_coaching_hint(0) is None


def test_active_listening_phrases_defined() -> None:
    assert "totally hear you" in ACTIVE_LISTENING_PHRASES
    assert "i got it" in ACTIVE_LISTENING_PHRASES
    assert "i understand where you're coming from" in ACTIVE_LISTENING_PHRASES
