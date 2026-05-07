from app.core.nlp.tiredness_analyzer import analyze_tiredness


def test_tiredness_high():
    assert analyze_tiredness("я дико устал, глаза слипаются")["tiredness_score"] >= 8


def test_anxiety_high():
    assert analyze_tiredness("дедлайн завтра, я всё завалю")["anxiety_score"] >= 7


def test_procrastination_high():
    assert analyze_tiredness("я залип в телефоне и ничего не сделал")["procrastination_probability"] >= 7


def test_readiness_high():
    assert analyze_tiredness("я отдохнул и могу попробовать 10 минут")["study_readiness"] >= 5

