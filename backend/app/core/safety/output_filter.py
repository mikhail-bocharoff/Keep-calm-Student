FORBIDDEN_PHRASES = [
    "перестань лениться",
    "просто начни",
    "ты должен собраться",
    "время уходит, работай",
    "контролирующим ситуацию",
    "более контролирующим ситуацию",
    "погрузиться в задачу",
    "не такой страшной",
]


def soften_output(text: str) -> str:
    cleaned = text
    for phrase in FORBIDDEN_PHRASES:
        if phrase == "контролирующим ситуацию":
            cleaned = cleaned.replace(phrase, "чуть спокойнее")
        elif phrase == "более контролирующим ситуацию":
            cleaned = cleaned.replace(phrase, "чуть спокойнее")
        elif phrase == "погрузиться в задачу":
            cleaned = cleaned.replace(phrase, "разобраться с тревогой")
        elif phrase == "не такой страшной":
            cleaned = cleaned.replace(phrase, "понятнее")
        else:
            cleaned = cleaned.replace(phrase, "давай мягко и без героизма")
    return cleaned
