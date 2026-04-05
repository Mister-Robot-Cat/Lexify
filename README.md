# Lexify 📖

**A production-ready Telegram bot for learning English vocabulary, powered by Google Gemini AI.**

---

## Features

- **Word Lookup** — Send any English word or phrase, get AI-generated translation, meaning, example, and explanation
- **Personal Vocabulary** — Every word is saved to your personal dictionary
- **Quiz Mode** — Practice with translation quizzes
- **Spaced Repetition** — Intelligent review scheduling (correct → +2 days, wrong → +1 hour)
- **Progress Tracking** — View your learning statistics anytime
- **Fuzzy Answer Matching** — Minor typos are accepted during quizzes

## Tech Stack

- **Python 3.11+**
- **FastAPI** — async web framework
- **python-telegram-bot** — async Telegram Bot API wrapper
- **MySQL** + **SQLAlchemy** (async ORM)
- **Google Gemini AI** — word explanations and translations

## Project Structure

```
app/
├── main.py                  # FastAPI entry point, bot lifecycle
├── config.py                # Settings from environment variables
├── bot/
│   ├── handlers.py          # Telegram command & message handlers
│   └── keyboards.py         # Inline keyboard builders
├── services/
│   ├── gemini_service.py    # Gemini API integration
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
4. **Google Gemini API Key** — get one at [Google AI Studio](https://aistudio.google.com/apikey)

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
GEMINI_API_KEY=AIza...
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

| Command     | Description                      |
|-------------|----------------------------------|
| `/start`    | Welcome message and instructions |
| `/quiz`     | Start a vocabulary quiz          |
| `/progress` | View your learning statistics    |

**To add a word:** simply type any English word or phrase — the bot will explain it and save it to your vocabulary.

## Database Schema

| Table        | Purpose                                    |
|--------------|--------------------------------------------|
| `users`      | Telegram users (identified by telegram_id) |
| `words`      | Global word dictionary with AI explanations|
| `user_words` | Per-user vocabulary with review stats      |

## Environment Variables

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| `TELEGRAM_BOT_TOKEN` | Yes      | Telegram Bot API token               |
| `DATABASE_URL`       | Yes      | MySQL async connection string        |
| `GEMINI_API_KEY`     | Yes      | Google Generative AI API key         |
| `LOG_LEVEL`          | No       | Logging level (default: INFO)        |
| `BOT_MODE`           | No       | `polling` or `webhook` (default: polling) |
| `WEBHOOK_URL`        | No       | Required when BOT_MODE=webhook       |

## License

MIT
