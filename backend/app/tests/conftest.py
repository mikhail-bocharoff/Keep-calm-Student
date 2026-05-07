import os


os.environ.setdefault("DATABASE_URL", "sqlite:////private/tmp/focusfloat-test.db")
os.environ.setdefault("LLM_MODE", "mock")
