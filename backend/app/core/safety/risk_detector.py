SELF_HARM_WORDS = [
    "не хочу жить", "покончить с собой", "суицид", "убить себя", "себя убью",
    "самоповреж", "порезать себя", "не вижу смысла жить",
]
MEDICAL_WORDS = ["не могу дышать", "боль в груди", "теряю сознание", "передозировка"]
PANIC_WORDS = ["паническая атака", "задыхаюсь от паники", "сильная паника"]


def detect_risk(text: str) -> dict[str, bool]:
    lowered = text.lower()
    return {
        "self_harm": any(word in lowered for word in SELF_HARM_WORDS),
        "medical_emergency": any(word in lowered for word in MEDICAL_WORDS),
        "panic_attack": any(word in lowered for word in PANIC_WORDS),
    }


SAFETY_RESPONSE = (
    "Мне важно отнестись к этому серьёзно. Похоже, сейчас тебе может быть небезопасно "
    "оставаться с этим одному. Пожалуйста, обратись к человеку рядом, которому доверяешь, "
    "или в экстренную службу твоей страны. Ты не обязан справляться с этим в одиночку. "
    "Я могу помочь сформулировать короткое сообщение: «Мне сейчас плохо, побудь со мной»."
)

