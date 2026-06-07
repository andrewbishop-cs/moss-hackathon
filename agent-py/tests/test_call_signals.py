from call_signals import (
    HARD_STOP_HINT,
    REBUILD_INTEREST_HINT,
    classify_prospect_utterance,
    coaching_hint_for,
    is_hard_stop,
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


def test_hard_stop_injects_exit_hint() -> None:
    assert is_hard_stop("I'm not interested, thanks.")
    assert is_hard_stop("Take me off your list")
    assert is_hard_stop("Stop calling me")
    assert is_hard_stop("I need to go")
    assert is_hard_stop("I'm not down for a spam call")
    assert is_hard_stop("No thanks")
    assert classify_prospect_utterance("I'm not interested") == "none"
    hint = coaching_hint_for("I'm not interested")
    assert hint == HARD_STOP_HINT
    assert "declined" in hint.lower()
    assert "do not pitch" in hint.lower()


def test_rejected_times_triggers_rebuild_hint() -> None:
    hint = coaching_hint_for("We're busy this quarter.", rejected_times=2)
    assert hint == REBUILD_INTEREST_HINT
    assert "rebuild" in hint.lower()
