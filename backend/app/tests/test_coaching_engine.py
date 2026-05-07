from app.services.coaching_engine import choose_recommended_mode


def test_recovery_for_overload():
    assert choose_recommended_mode({"overload_score": 8, "risk_flags": {}}) == "recovery"


def test_anti_guilt_for_procrastination():
    assert choose_recommended_mode({"procrastination_probability": 7, "risk_flags": {}}) == "anti_guilt"


def test_focus_for_readiness():
    assert choose_recommended_mode({"study_readiness": 5, "risk_flags": {}}) == "tiny_focus_round"


def test_safety_for_self_harm():
    assert choose_recommended_mode({"risk_flags": {"self_harm": True}}) == "safety"

