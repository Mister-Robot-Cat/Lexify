# Lexify 📖

**A multilingual Telegram bot for learning vocabulary, powered by Groq AI with themed word packs and spaced repetition.**

---

## Features

- **🌍 Multilingual Interface** — Bot UI in English, Russian, and Azerbaijani
- **📖 Bidirectional Translation** — Write in English OR your native language. Get AI-generated explanations and multiple translation options
- **🎯 Choose Any Learning Language** — Learn English, Russian, or Azerbaijani
- **❓ Grammar Chatbot** — Conversational AI tutor for grammar, vocabulary, and language questions with chat history
- **📝 IELTS Writing Evaluation** — Get detailed IELTS band scores and feedback on your essays
- **📦 Themed Word Packs** — Quick-start vocabulary with curated packs: Travel, Business, IELTS, Technology, Food, Health, Entertainment, Nature
- **🌟 Word of the Day** — Daily broadcast of interesting words to all users
- **📚 Personal Vocabulary** — Every word is saved to your personal dictionary
- **🎮 Quiz Modes** — Practice with 3 quiz types: Word→Translation, Translation→Word, Multiple Choice
- **⏰ Spaced Repetition** — Intelligent review scheduling (correct → +2 days, wrong → +1 hour)
- **📊 Progress Tracking** — View your learning statistics anytime
- **✨ Smart Matching** — Fuzzy answer matching and auto-correction during quizzes

## Tech Stack

- **Python 3.11+**
- **FastAPI** — async web framework
- **python-telegram-bot** — async Telegram Bot API wrapper with JobQueue
- **MySQL** + **SQLAlchemy** (async ORM)
- **Groq AI** — fast LLM API for word explanations and translations

## Project Structure

```
app/
├── main.py                  # FastAPI entry point, bot lifecycle
├── config.py                # Settings from environment variables
├── bot/
│   ├── handlers.py          # Telegram command & message handlers
│   ├── keyboards.py         # Inline keyboard builders
│   ├── i18n_simple.py       # Internationalization (i18n) system
│   ├── user_state.py        # Section routing & chat history state
│   ├── topics.py            # Themed word packs data
│   └── reminders.py         # Daily jobs (Word of the Day, reminders)
├── services/
│   ├── groq_service.py      # Groq API — word explanations & translations
│   ├── ask_service.py       # Groq API — grammar chatbot
│   ├── ielts_service.py     # Groq API — IELTS writing evaluation
│   ├── word_service.py      # Word CRUD and user management
│   └── quiz_service.py      # Quiz logic and spaced repetition
└── database/
    ├── models.py            # SQLAlchemy ORM models
    └── session.py           # Async engine and session factory
```

## Prerequisites

1. **Python 3.11+** installed
2. **MySQL** running (local or remote)
3. **Telegram Bot Token** — create a bot via [@BotFather](https://t.me/BotFather)
4. **Groq API Key** — get one at [Groq Console](https://console.groq.com/keys)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Lexify.git
cd Lexify
```

### 2. Create a virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the MySQL database

```sql
CREATE DATABASE lexify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/lexify
GROQ_API_KEY=gsk_...
LOG_LEVEL=INFO
BOT_MODE=polling
```

### 6. Run the bot

```bash
python -m app.main
```

The bot will:
- Create database tables automatically on first startup
- Start in **polling mode** by default (ideal for local development)
- Listen on `http://localhost:8000` (FastAPI health check at `/health`)

### Production (Webhook Mode)

Set in your `.env`:

```env
BOT_MODE=webhook
WEBHOOK_URL=https://yourdomain.com
```

Then deploy behind a reverse proxy (e.g., nginx) pointing to port 8000.

## Bot Commands

| Command          | Description                              |
|------------------|------------------------------------------|
| `/start`         | Welcome message and instructions         |
| `/menu`          | Choose section (Words/Grammar/IELTS)     |
| `/quiz`          | Start a vocabulary quiz                  |
| `/library`       | View your word collection                |
| `/topics`        | Browse themed word packs                 |
| `/ask`           | Grammar chatbot (new conversation)       |
| `/clear`         | Clear grammar chat history               |
| `/ielts`         | IELTS writing evaluation                 |
| `/language`      | Choose translation language              |
| `/learning`      | Choose what language to learn            |
| `/ui`            | Change bot interface language            |
| `/progress`      | View your learning statistics            |
| `/delete <word>` | Remove a word from your library          |
| `/cancel`        | Cancel active quiz                       |

**How to use:**
- **Type any word/phrase** in English → get detailed explanation and save to vocabulary
- **Type in your native language** → get multiple translation options with examples
- **Use `/menu`** → switch between Word Lookup, Grammar Q&A, and IELTS Writing sections
- **Use `/ask`** → chat with AI tutor about grammar, vocabulary, or language questions
- **Use `/topics`** → quickly add themed vocabulary (Travel, Business, IELTS, etc.)
- **Practice with `/quiz`** → 3 quiz modes with spaced repetition

## Database Schema

| Table        | Purpose                                    |
|--------------|--------------------------------------------|
| `users`      | Telegram users with language preferences    |
| `words`      | Global word dictionary with AI explanations|
| `user_words` | Per-user vocabulary with review stats      |

**User preferences stored:**
- `language` — Native/translation language (Russian, Turkish, etc.)
- `ui_language` — Bot interface language (en, ru, az)
- `learning_language` — Target language to learn (English, Russian, etc.)

## Environment Variables

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| `TELEGRAM_BOT_TOKEN` | Yes      | Telegram Bot API token               |
| `DATABASE_URL`       | Yes      | MySQL async connection string        |
| `GROQ_API_KEY`       | Yes      | Groq API key for LLM access         |
| `GROQ_MODEL`         | No       | Groq model name (default: llama-3.3-70b-versatile) |
| `LOG_LEVEL`          | No       | Logging level (default: INFO)        |
| `BOT_MODE`           | No       | `polling` or `webhook` (default: polling) |
| `WEBHOOK_URL`        | No       | Required when BOT_MODE=webhook       |

## License

MIT
