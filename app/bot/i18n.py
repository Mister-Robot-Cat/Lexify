"""Internationalization (i18n) module for Lexify bot.

Provides all user-facing strings translated into supported UI languages.
Usage: get a translator via ``t = get_translator(ui_language)`` then call
``t("key")`` or ``t("key", name="value")`` for interpolation.
"""

from __future__ import annotations

# ─── Supported UI languages ──────────────────────────────────────────────────

UI_LANGUAGES: dict[str, str] = {
    "en": "🇬🇧 English",
    "ru": "🇷🇺 Русский",
    "tr": "🇹🇷 Türkçe",
    "es": "🇪🇸 Español",
    "fr": "🇫🇷 Français",
    "de": "🇩🇪 Deutsch",
    "pt": "🇧🇷 Português",
    "zh": "🇨🇳 中文",
    "ar": "🇸🇦 العربية",
    "ja": "🇯🇵 日本語",
    "ko": "🇰🇷 한국어",
    "it": "🇮🇹 Italiano",
    "hi": "🇮🇳 हिन्दी",
}

# ─── Translation tables ──────────────────────────────────────────────────────
# Each key maps to a dict of language_code -> string template.
# Templates may use {placeholders} for runtime interpolation.

_STRINGS: dict[str, dict[str, str]] = {
    # /start
    "welcome": {
        "en": "👋 Welcome to *Lexify*, {name}\\!\n\nI help you learn vocabulary\\.\n\n📌 *How to use:*\n• Send me any word or phrase \\— I'll explain it and save it\\.\n• /quiz \\— practice your vocabulary\n• /library \\— view your word collection\n• /language \\— choose translation language\n• /learning \\— choose what language to learn\n• /ui \\— change bot interface language\n• /topics \\— themed word packs\n• /delete \\<word\\> \\— remove a word\n• /progress \\— see your learning stats\n\nLet's start learning\\! 🚀",
        "ru": "👋 Добро пожаловать в *Lexify*, {name}\\!\n\nЯ помогу тебе учить слова\\.\n\n📌 *Как пользоваться:*\n• Отправь мне любое слово или фразу \\— я объясню и сохраню\\.\n• /quiz \\— тренировка словарного запаса\n• /library \\— твоя коллекция слов\n• /language \\— выбрать язык перевода\n• /learning \\— выбрать изучаемый язык\n• /ui \\— сменить язык интерфейса\n• /topics \\— тематические наборы слов\n• /delete \\<слово\\> \\— удалить слово\n• /progress \\— статистика обучения\n\nНачнём учиться\\! 🚀",
        "tr": "👋 *Lexify*'a hoş geldin, {name}\\!\n\nKelime öğrenmene yardımcı oluyorum\\.\n\n📌 *Nasıl kullanılır:*\n• Bana herhangi bir kelime veya ifade gönder \\— açıklayıp kaydedeceğim\\.\n• /quiz \\— kelime pratiği\n• /library \\— kelime koleksiyonun\n• /language \\— çeviri dilini seç\n• /learning \\— öğrenilecek dili seç\n• /ui \\— arayüz dilini değiştir\n• /topics \\— tematik kelime paketleri\n• /delete \\<kelime\\> \\— kelimeyi sil\n• /progress \\— öğrenme istatistikleri\n\nHaydi öğrenmeye başlayalım\\! 🚀",
    },

    # /progress
    "progress_title": {
        "en": "📊 <b>Your Progress</b>",
        "ru": "📊 <b>Твой прогресс</b>",
        "tr": "📊 <b>İlerlemeniz</b>",
    },
    "progress_words": {
        "en": "📚 Words in vocabulary: <b>{count}</b>",
        "ru": "📚 Слов в словаре: <b>{count}</b>",
        "tr": "📚 Kelime sayısı: <b>{count}</b>",
    },
    "progress_correct": {
        "en": "✅ Correct answers: <b>{count}</b>",
        "ru": "✅ Правильных ответов: <b>{count}</b>",
        "tr": "✅ Doğru cevaplar: <b>{count}</b>",
    },
    "progress_wrong": {
        "en": "❌ Wrong answers: <b>{count}</b>",
        "ru": "❌ Неправильных ответов: <b>{count}</b>",
        "tr": "❌ Yanlış cevaplar: <b>{count}</b>",
    },
    "progress_accuracy": {
        "en": "📈 Accuracy: <b>{pct}%</b>",
        "ru": "📈 Точность: <b>{pct}%</b>",
        "tr": "📈 Doğruluk: <b>{pct}%</b>",
    },
    "progress_due": {
        "en": "🔄 Due for review: <b>{count}</b>",
        "ru": "🔄 На повторение: <b>{count}</b>",
        "tr": "🔄 Tekrar edilecek: <b>{count}</b>",
    },

    # /library
    "library_title": {
        "en": "📚 <b>Your Library</b>  ({count} words)",
        "ru": "📚 <b>Твоя библиотека</b>  ({count} слов)",
        "tr": "📚 <b>Kütüphanen</b>  ({count} kelime)",
    },
    "library_empty": {
        "en": "📚 <b>Your Library</b>\n\nYour vocabulary is empty. Send me a word to get started!",
        "ru": "📚 <b>Твоя библиотека</b>\n\nСловарь пуст. Отправь мне слово, чтобы начать!",
        "tr": "📚 <b>Kütüphanen</b>\n\nKelime listeniz boş. Başlamak için bir kelime gönderin!",
    },

    # /language
    "language_title": {
        "en": "🌍 <b>Choose your translation language</b>\n\nCurrent: <b>{current}</b>\n\nTap a language below to switch:",
        "ru": "🌍 <b>Выбери язык перевода</b>\n\nТекущий: <b>{current}</b>\n\nНажми на язык ниже:",
        "tr": "🌍 <b>Çeviri dilini seç</b>\n\nMevcut: <b>{current}</b>\n\nDeğiştirmek için aşağıdan seç:",
    },

    # /learning
    "learning_title": {
        "en": "📖 <b>Choose the language you want to learn</b>\n\nCurrent: <b>{current}</b>\n\nTap a language below to switch:",
        "ru": "📖 <b>Выбери язык для изучения</b>\n\nТекущий: <b>{current}</b>\n\nНажми на язык ниже:",
        "tr": "📖 <b>Öğrenmek istediğin dili seç</b>\n\nMevcut: <b>{current}</b>\n\nDeğiştirmek için aşağıdan seç:",
    },

    # /ui
    "ui_title": {
        "en": "🖥 <b>Choose bot interface language</b>\n\nCurrent: <b>{current}</b>",
        "ru": "🖥 <b>Выбери язык интерфейса бота</b>\n\nТекущий: <b>{current}</b>",
        "tr": "🖥 <b>Bot arayüz dilini seç</b>\n\nMevcut: <b>{current}</b>",
    },
    "ui_changed": {
        "en": "✅ Interface language changed to <b>{lang}</b>",
        "ru": "✅ Язык интерфейса изменён на <b>{lang}</b>",
        "tr": "✅ Arayüz dili <b>{lang}</b> olarak değiştirildi",
    },

    # /delete
    "delete_usage": {
        "en": "Usage: /delete <word>\n\nExample: /delete cough",
        "ru": "Использование: /delete <слово>\n\nПример: /delete cough",
        "tr": "Kullanım: /delete <kelime>\n\nÖrnek: /delete cough",
    },
    "delete_ok": {
        "en": "🗑 <b>{word}</b> removed from your library.",
        "ru": "🗑 <b>{word}</b> удалено из библиотеки.",
        "tr": "🗑 <b>{word}</b> kütüphaneden silindi.",
    },
    "delete_not_found": {
        "en": "⚠️ <b>{word}</b> not found in your library.",
        "ru": "⚠️ <b>{word}</b> не найдено в библиотеке.",
        "tr": "⚠️ <b>{word}</b> kütüphanende bulunamadı.",
    },

    # Word processing
    "word_too_long": {
        "en": "Please send a word or short phrase (max 200 characters).",
        "ru": "Отправь слово или короткую фразу (макс. 200 символов).",
        "tr": "Lütfen bir kelime veya kısa ifade gönderin (maks. 200 karakter).",
    },
    "word_looking_up": {
        "en": "🔍 Looking up the word…",
        "ru": "🔍 Ищу слово…",
        "tr": "🔍 Kelime aranıyor…",
    },
    "word_added": {
        "en": "✅ Added to your vocabulary\\!",
        "ru": "✅ Добавлено в словарь\\!",
        "tr": "✅ Kelime listenize eklendi\\!",
    },
    "word_exists": {
        "en": "ℹ️ Already in your vocabulary\\.",
        "ru": "ℹ️ Уже есть в словаре\\.",
        "tr": "ℹ️ Zaten kelime listenizde\\.",
    },
    "word_error": {
        "en": "⚠️ I couldn't process that word. Please try again or use a different word.",
        "ru": "⚠️ Не удалось обработать слово. Попробуй другое.",
        "tr": "⚠️ Kelime işlenemedi. Lütfen tekrar deneyin veya farklı bir kelime kullanın.",
    },
    "word_fatal": {
        "en": "❌ Something went wrong. Please try again later.",
        "ru": "❌ Что-то пошло не так. Попробуй позже.",
        "tr": "❌ Bir şeyler ters gitti. Lütfen daha sonra tekrar deneyin.",
    },
    "reverse_translation_title": {
        "en": "Translation options for {word}",
        "ru": "Варианты перевода для {word}",
        "tr": "{word} için çeviriler",
    },
    "translations": {
        "en": "Translations",
        "ru": "Переводы",
        "tr": "Çeviriler",
    },
    "meanings": {
        "en": "Meanings",
        "ru": "Значения",
        "tr": "Anlamlar",
    },
    "examples": {
        "en": "Examples",
        "ru": "Примеры",
        "tr": "Örnekler",
    },
    "context": {
        "en": "When to use",
        "ru": "Когда использовать",
        "tr": "Ne zaman kullan",
    },

    # Quiz
    "quiz_choose_mode": {
        "en": "🧠 *Choose quiz mode:*",
        "ru": "🧠 *Выбери режим квиза:*",
        "tr": "🧠 *Quiz modunu seçin:*",
    },
    "quiz_finished": {
        "en": "🏁 *Quiz finished\\!* You've gone through all your words\\.",
        "ru": "🏁 *Квиз завершён\\!* Ты прошёл все слова\\.",
        "tr": "🏁 *Quiz bitti\\!* Tüm kelimeleri tamamladınız\\.",
    },
    "quiz_no_words": {
        "en": "🎉 No words in your vocabulary yet\\!\n\nSend me a word first, then try /quiz again\\.",
        "ru": "🎉 В словаре пока нет слов\\!\n\nОтправь мне слово, потом попробуй /quiz\\.",
        "tr": "🎉 Henüz kelime listenizde kelime yok\\!\n\nÖnce bir kelime gönderin, sonra /quiz deneyin\\.",
    },
    "quiz_no_active": {
        "en": "No active quiz question. Use /quiz to start.",
        "ru": "Нет активного вопроса. Используй /quiz чтобы начать.",
        "tr": "Aktif quiz sorusu yok. Başlamak için /quiz kullanın.",
    },
    "quiz_correct": {
        "en": "✅ *Correct\\!*",
        "ru": "✅ *Правильно\\!*",
        "tr": "✅ *Doğru\\!*",
    },
    "quiz_wrong": {
        "en": "❌ *Wrong\\!*",
        "ru": "❌ *Неправильно\\!*",
        "tr": "❌ *Yanlış\\!*",
    },
    "quiz_skipped": {
        "en": "⏭ Skipped\\. The answer was: *{answer}*",
        "ru": "⏭ Пропущено\\. Ответ: *{answer}*",
        "tr": "⏭ Atlandı\\. Cevap: *{answer}*",
    },
    "quiz_streak": {
        "en": "🔥 Streak: {count} correct",
        "ru": "🔥 Серия: {count} правильных",
        "tr": "🔥 Seri: {count} doğru",
    },
    "quiz_your_answer": {
        "en": "Your answer: {answer}",
        "ru": "Твой ответ: {answer}",
        "tr": "Cevabınız: {answer}",
    },
    "quiz_correct_answer": {
        "en": "Correct answer: *{answer}*",
        "ru": "Правильный ответ: *{answer}*",
        "tr": "Doğru cevap: *{answer}*",
    },
    "quiz_ended": {
        "en": "Quiz ended. Send me a word to learn or /quiz to try again!",
        "ru": "Квиз окончен. Отправь слово или /quiz чтобы начать снова!",
        "tr": "Quiz bitti. Kelime gönderin veya /quiz ile tekrar deneyin!",
    },
    "quiz_classic_q": {
        "en": "🧠 *Quiz Time\\!* \\(🔤 Word → Translation\\)\n\nWhat is the translation of:\n\n👉 *{word}*\n\nType your answer below\\.",
        "ru": "🧠 *Квиз\\!* \\(🔤 Слово → Перевод\\)\n\nКак переводится:\n\n👉 *{word}*\n\nНапиши ответ ниже\\.",
        "tr": "🧠 *Quiz\\!* \\(🔤 Kelime → Çeviri\\)\n\nBunun çevirisi nedir:\n\n👉 *{word}*\n\nCevabınızı yazın\\.",
    },
    "quiz_reverse_q": {
        "en": "🧠 *Quiz Time\\!* \\(🔄 Translation → Word\\)\n\nWhat is the word for:\n\n👉 *{translation}*\n\nType your answer below\\.",
        "ru": "🧠 *Квиз\\!* \\(🔄 Перевод → Слово\\)\n\nКакое это слово:\n\n👉 *{translation}*\n\nНапиши ответ ниже\\.",
        "tr": "🧠 *Quiz\\!* \\(🔄 Çeviri → Kelime\\)\n\nBu kelimenin karşılığı nedir:\n\n👉 *{translation}*\n\nCevabınızı yazın\\.",
    },
    "quiz_choices_q": {
        "en": "🧠 *Quiz Time\\!* \\(🅰️ Multiple Choice\\)\n\nWhat is the translation of:\n\n👉 *{word}*",
        "ru": "🧠 *Квиз\\!* \\(🅰️ Выбери ответ\\)\n\nКак переводится:\n\n👉 *{word}*",
        "tr": "🧠 *Quiz\\!* \\(🅰️ Çoktan Seçmeli\\)\n\nBunun çevirisi nedir:\n\n👉 *{word}*",
    },

    # Quiz mode buttons (plain text, no markdown)
    "btn_classic": {
        "en": "🔤 Word → Translation",
        "ru": "🔤 Слово → Перевод",
        "tr": "🔤 Kelime → Çeviri",
    },
    "btn_reverse": {
        "en": "🔄 Translation → Word",
        "ru": "🔄 Перевод → Слово",
        "tr": "🔄 Çeviri → Kelime",
    },
    "btn_choices": {
        "en": "🅰️ Multiple Choice",
        "ru": "🅰️ Выбери ответ",
        "tr": "🅰️ Çoktan Seçmeli",
    },

    # Reminders
    "reminder_title": {
        "en": "📬 <b>Daily Reminder</b>",
        "ru": "📬 <b>Ежедневное напоминание</b>",
        "tr": "📬 <b>Günlük Hatırlatma</b>",
    },
    "reminder_body": {
        "en": "You have <b>{count}</b> word(s) due for review!\n\nUse /quiz to practice them now 🎯",
        "ru": "У тебя <b>{count}</b> слов на повторение!\n\nИспользуй /quiz чтобы повторить 🎯",
        "tr": "<b>{count}</b> kelime tekrar edilmeli!\n\nŞimdi /quiz ile pratik yap 🎯",
    },

    # Topics
    "topics_title": {
        "en": "📦 <b>Themed Word Packs</b>\n\nChoose a topic to add words to your library:",
        "ru": "📦 <b>Тематические наборы слов</b>\n\nВыбери тему, чтобы добавить слова:",
        "tr": "📦 <b>Tematik Kelime Paketleri</b>\n\nKütüphanenize kelime eklemek için bir konu seçin:",
    },
    "topics_adding": {
        "en": "📥 Adding <b>{topic}</b> words to your library… This may take a moment.",
        "ru": "📥 Добавляю слова из набора <b>{topic}</b>… Подожди немного.",
        "tr": "📥 <b>{topic}</b> kelimeleri ekleniyor… Biraz bekleyin.",
    },
    "topics_done": {
        "en": "✅ Added <b>{added}</b> new words from <b>{topic}</b>!\n({skipped} already in your library)",
        "ru": "✅ Добавлено <b>{added}</b> новых слов из <b>{topic}</b>!\n({skipped} уже были в библиотеке)",
        "tr": "✅ <b>{topic}</b> paketinden <b>{added}</b> yeni kelime eklendi!\n({skipped} zaten kütüphanenizde)",
    },

    # Word of the Day
    "wotd_title": {
        "en": "🌟 <b>Word of the Day</b>",
        "ru": "🌟 <b>Слово дня</b>",
        "tr": "🌟 <b>Günün Kelimesi</b>",
    },
}

# ─── Fallback ─────────────────────────────────────────────────────────────────

_FALLBACK_LANG = "en"


def get_text(key: str, lang: str = "en", **kwargs: str) -> str:
    """Return a translated string for *key* in *lang*, with interpolation.

    Falls back to English if the key or language is missing.
    """
    table = _STRINGS.get(key)
    if table is None:
        return key  # unknown key — return as-is
    template = table.get(lang) or table.get(_FALLBACK_LANG, key)
    try:
        return template.format(**kwargs) if kwargs else template
    except KeyError:
        return template


def get_translator(lang: str = "en"):
    """Return a convenience callable ``t(key, **kw)`` bound to *lang*."""
    def _t(key: str, **kwargs: str) -> str:
        return get_text(key, lang, **kwargs)
    return _t
