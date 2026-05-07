from app.core.nlp.rule_based import (
    ANXIETY_WORDS,
    PROCRASTINATION_WORDS,
    READINESS_WORDS,
    TIREDNESS_WORDS,
    count_matches,
)
from app.core.safety.risk_detector import detect_risk


def analyze_tiredness(text: str) -> dict:
    tired = count_matches(text, TIREDNESS_WORDS)
    anxiety = count_matches(text, ANXIETY_WORDS)
    procrastination = count_matches(text, PROCRASTINATION_WORDS)
    readiness = count_matches(text, READINESS_WORDS)
    lowered = text.lower()
    has_bad_feeling = any(phrase in lowered for phrase in ["мне плохо", "очень плохо", "плохо"])
    has_ok_feeling = any(phrase in lowered for phrase in ["мне нормально", "нормально", "в порядке"])

    tiredness_score = 0
    if tired >= 3:
        tiredness_score = 9
    elif tired == 2:
        tiredness_score = 8
    elif tired == 1:
        tiredness_score = 6

    anxiety_score = 0
    if anxiety >= 2:
        anxiety_score = 8
    elif anxiety == 1:
        anxiety_score = 5
    if has_bad_feeling:
        anxiety_score = max(anxiety_score, 7)

    deadline_pressure = 0
    has_deadline = any(word in lowered for word in ["дедлайн", "срок", "завтра", "через"])
    if has_deadline and tired:
        deadline_pressure = 8
    elif has_deadline:
        deadline_pressure = 7

    procrastination_probability = 8 if procrastination else 0
    study_readiness = 7 if readiness else 2
    if has_ok_feeling:
        study_readiness = max(study_readiness, 6)
    if tiredness_score >= 8 and anxiety_score >= 6:
        overload_score = 9
    else:
        overload_score = max(tiredness_score - 1, anxiety_score - 1, 0)

    if tiredness_score >= 7:
        intent = "tired"
    elif anxiety_score >= 7:
        intent = "anxious"
    elif study_readiness >= 6:
        intent = "ready_to_study"
    elif procrastination_probability >= 7:
        intent = "procrastination"
    else:
        intent = "unknown"

    reasons = []
    if tired:
        reasons.append("есть признаки усталости")
    if anxiety:
        reasons.append("есть тревога или давление дедлайна")
    if procrastination:
        reasons.append("есть прокрастинация")
    if readiness:
        reasons.append("есть готовность к мягкому старту")

    return {
        "tiredness_score": tiredness_score,
        "anxiety_score": anxiety_score,
        "deadline_pressure": deadline_pressure,
        "study_readiness": study_readiness,
        "overload_score": overload_score,
        "procrastination_probability": procrastination_probability,
        "detected_intent": intent,
        "risk_flags": detect_risk(text),
        "short_reason": ", ".join(reasons) if reasons else "явных маркеров мало",
    }
