# ОтдохнИИ

AI-ассистент бережного геймифицированного коучинга для студентов 16-24 лет.

Главная идея: «Не можешь учиться - не учись. Играй в отдых, а фокус вернётся сам».

MVP содержит FastAPI backend, React + TypeScript frontend, Telegram-бота на aiogram, SQLite и LLM-адаптер с режимами `mock`, `api`, `local`. По умолчанию всё работает в `LLM_MODE=mock`, без API-ключа.

## Структура

```text
focusfloat/
  backend/
  frontend/
  telegram_bot/
  README.md
  docker-compose.yml
```

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

На Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Health check: `http://localhost:8000/api/health`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Открой `http://localhost:5173`.

## Telegram bot

```bash
cd telegram_bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../backend/.env.example .env
python bot.py
```

В `.env` укажи `TELEGRAM_BOT_TOKEN` и `BACKEND_URL=http://localhost:8000`.

Команды: `/start`, `/help`, `/status`, `/topic`, `/ritual`, `/focus`, `/progress`, `/reset`.

## .env

`backend/.env.example`:

```env
APP_NAME=ОтдохнИИ
APP_ENV=development
DATABASE_URL=sqlite:///./otdohnii.db
LLM_MODE=mock
LLM_API_KEY=
LLM_MODEL_NAME=
LLM_BASE_URL=
LOCAL_MODEL_PATH=
TELEGRAM_BOT_TOKEN=
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

Название приложения берётся из `APP_NAME`.

## LLM modes

`mock` - режим по умолчанию. Использует шаблонные ответы и rule-based анализ, поэтому MVP запускается сразу.

`api` - OpenAI-compatible API. Для реального нейросетевого чата укажи в `backend/.env`:

```env
LLM_MODE=api
LLM_API_KEY=...
LLM_MODEL_NAME=model-name
LLM_BASE_URL=https://your-provider.example/v1
```

Если `LLM_BASE_URL` не указан, backend использует `https://api.openai.com/v1`. Для Groq можно поставить `LLM_BASE_URL=https://api.groq.com/openai/v1`, а `LLM_MODEL_NAME` взять из консоли Groq. Ключи не коммить и не вставляй в чат.

`local` - локальный OpenAI-compatible endpoint:

```env
LLM_MODE=local
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL_NAME=local-model-name
```

Конкретная локальная модель не захардкожена.

Проверить, какой режим реально подхватился:

```bash
curl http://localhost:8000/api/health
```

В ответе будет блок `llm` с `mode`, `model`, `base_url`, `configured` и `has_api_key`. Сам API-ключ не возвращается.

## Что умеет MVP

- Чат с бережным coaching engine.
- Rule-based Tiredness Score: усталость, тревога, дедлайн, готовность, перегруз, прокрастинация.
- Risk detector без игрового тона при признаках опасности.
- Recovery Mode, Anti-guilt Mode, Tiny Focus Round.
- Кошачий режим, Пожиратель тревоги, Сжигатель списка задач.
- Осколки отдыха и Сонный котёнок: 10 осколков = +1 уровень.
- Telegram-бот как тонкий клиент backend.

## Как пользоваться

1. Запусти backend и frontend.
2. Открой веб-приложение.
3. Во вкладке «Настройки» задай тему, задачу, дедлайн и уровень энергии.
4. В чате напиши честно, что происходит: усталость, дедлайн, тревога, прокрастинация.
5. Выбери ритуал или запусти 10-минутный фокус-раунд.
6. Смотри прогресс во вкладке «Прогресс».

## Сознательно исключено из MVP

Нет загрузки PDF/DOCX/TXT/MD, индексации, чанкинга, embeddings, vector DB, RAG, голосового ввода, OAuth, платежей, сложной аналитики и мобильного приложения.

Учебный контекст задаётся только текстом: тема, текущая задача, дедлайн, энергия и свободные сообщения в чате.

## Тесты

```bash
cd backend
pytest
```
