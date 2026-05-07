from app.core.nlp.tiredness_analyzer import analyze_tiredness


def test_tiredness_high():
    assert analyze_tiredness("я дико устал, глаза слипаются")["tiredness_score"] >= 8


def test_anxiety_high():
    assert analyze_tiredness("дедлайн завтра, я всё завалю")["anxiety_score"] >= 7


def test_procrastination_high():
    assert analyze_tiredness("я залип в телефоне и ничего не сделал")["procrastination_probability"] >= 7


def test_readiness_high():
    assert analyze_tiredness("я отдохнул и могу попробовать 10 минут")["study_readiness"] >= 5


def test_bad_feeling_is_not_unknown():
    state = analyze_tiredness("мне плохо")
    assert state["anxiety_score"] >= 7
    assert state["detected_intent"] == "anxious"


def test_normal_feeling_can_start_gently():
    state = analyze_tiredness("мне нормально")
    assert state["study_readiness"] >= 5
    assert state["detected_intent"] == "ready_to_study"
