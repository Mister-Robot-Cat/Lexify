"""
Lexify bot internationalization (i18n) module.

Provides all user-facing strings translated into supported UI languages.
Usage: get a translator via ``t = get_translator(ui_language)`` then call
``t("key")`` or ``t("key", name="value")`` for interpolation.
"""

from __future__ import annotations

# ─── Supported UI languages ──────────────────────────────────────────────────

UI_LANGUAGES: dict[str, str] = {
    "en": "English",
    "ru": "Русский",
    "az": "Azərbaycanca"
}

# ─── Translation tables ──────────────────────────────────────────────────────
# Each key maps to a dict of language_code -> string template.
# Templates may use {placeholders} for runtime interpolation.

_STRINGS: dict[str, dict[str, str]] = {
    # /start
    "welcome": {
        "en": "👋 Welcome to <b>Lexify</b>, {name}!\n\nI help you learn vocabulary.\n\n📌 <b>How to use:</b>\n• Send me any word or phrase — I'll explain it and save it.\n• /quiz — practice your vocabulary\n• /library — view your word collection\n• /menu — choose section (Words/Grammar/IELTS)\n• /ask — grammar chatbot\n• /topics — themed word packs\n• /progress — see your learning stats\n\nLet's start learning! 🚀",
        "ru": "👋 Добро пожаловать в <b>Lexify</b>, {name}!\n\nЯ помогу тебе учить слова.\n\n📌 <b>Как пользоваться:</b>\n• Отправь мне слово или фразу — я объясню и сохраню.\n• /quiz — тренировка словарного запаса\n• /library — твоя коллекция слов\n• /menu — выбрать раздел (Слова/Грамматика/IELTS)\n• /ask — чатбот по грамматике\n• /topics — тематические наборы слов\n• /progress — статистика обучения\n\nНачнём учиться! 🚀",
        "az": "👋 <b>Lexify</b>'a xoş gəldin, {name}!\n\nSənə sözləri öyrənməyə kömək edirəm.\n\n📌 <b>Necə istifadə etmək:</b>\n• Mənə söz və ya ifadə göndər — izah edərəm və saxlayacağam.\n• /quiz — lüğət məşqi\n• /library — söz kolleksiyan\n• /menu — bölmə seç (Sözlər/Qrammatika/IELTS)\n• /ask — qrammatika çatbotu\n• /topics — tematik söz paketləri\n• /progress — öyrənmə statistikaları\n\nÖyrənməyə başlayaq! 🚀",
    },

    # /progress
    "progress_title": {
        "en": "📊 <b>Your Progress</b>",
        "ru": "📊 <b>Твой прогресс</b>",
        "az": "📊 <b>Sənin İrəliləməyin</b>",
    },
    "progress_words": {
        "en": "📚 Words in vocabulary: <b>{count}</b>",
        "ru": "📚 Слов в словаре: <b>{count}</b>",
        "az": "📚 Lüğətdə sözlər: <b>{count}</b>",
    },
    "progress_correct": {
        "en": "✅ Correct answers: <b>{count}</b>",
        "ru": "✅ Правильных ответов: <b>{count}</b>",
        "az": "✅ Doğru cavablar: <b>{count}</b>",
    },
    "progress_wrong": {
        "en": "❌ Wrong answers: <b>{count}</b>",
        "ru": "❌ Неправильных ответов: <b>{count}</b>",
        "az": "❌ Yanlış cavablar: <b>{count}</b>",
    },
    "progress_accuracy": {
        "en": "📈 Accuracy: <b>{pct}%</b>",
        "ru": "📈 Точность: <b>{pct}%</b>",
        "az": "📈 Dəqiqlik: <b>{pct}%</b>",
    },
    "progress_due": {
        "en": "🔄 Due for review: <b>{count}</b>",
        "ru": "🔄 На повторение: <b>{count}</b>",
        "az": "🔄 Təkrar üçün: <b>{count}</b>",
    },

    # /library
    "library_title": {
        "en": "📚 <b>Your Library</b>  ({count} words)",
        "ru": "📚 <b>Твоя библиотека</b>  ({count} слов)",
        "az": "📚 <b>Sənin Kitabxanan</b>  ({count} söz)",
    },
    "library_empty": {
        "en": "📚 <b>Your Library</b>\n\nYour vocabulary is empty. Send me a word to get started!",
        "ru": "📚 <b>Твоя библиотека</b>\n\nСловарь пуст. Отправь мне слово, чтобы начать!",
        "az": "📚 <b>Sənin Kitabxanan</b>\n\nLüğətin boşdur. Başlamaq üçün mənə bir söz göndər!",
    },

    # /language
    "language_title": {
        "en": "🌍 <b>Choose your translation language</b>\n\nCurrent: <b>{current}</b>\n\nTap a language below to switch:",
        "ru": "🌍 <b>Выбери язык перевода</b>\n\nТекущий: <b>{current}</b>\n\nНажми на язык ниже:",
        "az": "🌍 <b>Tərcümə dilini seç</b>\n\nCari: <b>{current}</b>\n\nDəyişdirmək üçün aşağıdakı dillərdən birinə toxun:",
    },
    "language_set": {
        "en": "✅ Translation language set to: <b>{language}</b>",
        "ru": "✅ Язык перевода установлен: <b>{language}</b>",
        "az": "✅ Tərcümə dili quruldu: <b>{language}</b>",
    },

    # /learning
    "learning_title": {
        "en": "📖 <b>Choose what language to learn</b>\n\nCurrent: <b>{current}</b>\n\nTap a language below to switch:",
        "ru": "📖 <b>Выбери язык для изучения</b>\n\nТекущий: <b>{current}</b>\n\nНажми на язык ниже:",
        "az": "📖 <b>Öyrəniləcək dili seç</b>\n\nCari: <b>{current}</b>\n\nDəyişdirmək üçün aşağıdakı dillərdən birinə toxun:",
    },
    "learning_set": {
        "en": "✅ Learning language set to: <b>{language}</b>",
        "ru": "✅ Язык для изучения установлен: <b>{language}</b>",
        "az": "✅ Öyrəniləcək dil quruldu: <b>{language}</b>",
    },

    # /ui
    "ui_title": {
        "en": "🖥 <b>Choose bot interface language</b>\n\nCurrent: <b>{current}</b>\n\nTap a language below to switch:",
        "ru": "🖥 <b>Выбери язык интерфейса</b>\n\nТекущий: <b>{current}</b>\n\nНажми на язык ниже:",
        "az": "🖥 <b>Bot interfeys dilini seç</b>\n\nCari: <b>{current}</b>\n\nDəyişdirmək üçün aşağıdakı dillərdən birinə toxun:",
    },
    "ui_set": {
        "en": "✅ Interface language changed to: <b>{language}</b>",
        "ru": "✅ Язык интерфейса изменен на: <b>{language}</b>",
        "az": "✅ Interfeys dili dəyişdirildi: <b>{language}</b>",
    },

    # /topics
    "topics_title": {
        "en": "📦 <b>Choose a themed word pack</b>\n\nQuickly add vocabulary by topic:",
        "ru": "📦 <b>Выбери тематический набор слов</b>\n\nБыстро добавь лексику по темам:",
        "az": "📦 <b>Tematik söz paketi seç</b>\n\nMövzüyə görə tez lüğət əlavə et:",
    },
    "topic_added": {
        "en": "✅ Added <b>{count}</b> words from <b>{topic}</b> pack (total: {total})",
        "ru": "✅ Добавлено <b>{count}</b> слов из набора <b>{topic}</b> (всего: {total})",
        "az": "✅ <b>{topic}</b> paketindən <b>{count}</b> söz əlavə edildi (cəmi: {total})",
    },
    "topic_error": {
        "en": "❌ Failed to add topic pack. Please try again.",
        "ru": "❌ Не удалось добавить набор слов. Попробуйте еще раз.",
        "az": "❌ Mövzu paketi əlavə edilə bilmədi. Zəhmət olmasa yenidən cəhd edin.",
    },

    # /delete
    "delete_ok": {
        "en": "✅ Word <b>{word}</b> removed from your library.",
        "ru": "✅ Слово <b>{word}</b> удалено из библиотеки.",
        "az": "✅ <b>{word}</b> sözü kitabxanandan silindi.",
    },
    "delete_not_found": {
        "en": "❌ Word <b>{word}</b> not found in your library.",
        "ru": "❌ Слово <b>{word}</b> не найдено в библиотеке.",
        "az": "❌ <b>{word}</b> sözü kitabxanada tapılmadı.",
    },

    # /ielts
    "ielts_title": {
        "en": "📝 IELTS Writing Evaluation",
        "ru": "📝 Оценка письма IELTS",
        "az": "📝 IELTS Yazım Qiymətləndirməsi",
    },
    "ielts_instructions": {
        "en": "Send your writing sample (minimum 50 characters) and get detailed feedback according to IELTS criteria:\n\n• Task Response (TR)\n• Coherence and Cohesion (CC)\n• Lexical Resource (LR)\n• Grammatical Range and Accuracy (GRA)",
        "ru": "Отправьте свой текст (минимум 50 символов) и получите подробную обратную связь по критериям IELTS:\n\n• Task Response (TR)\n• Coherence and Cohesion (CC)\n• Lexical Resource (LR)\n• Grammatical Range and Accuracy (GRA)",
        "az": "Yazı nümunənizi göndərin (minimum 50 simvol) və IELTS meyarlarına görə ətraflı rəy alın:\n\n• Task Response (TR)\n• Coherence and Cohesion (CC)\n• Lexical Resource (LR)\n• Grammatical Range and Accuracy (GRA)",
    },
    "ielts_send_text": {
        "en": "📤 Send your text now:",
        "ru": "📤 Отправьте ваш текст:",
        "az": "📤 Mətnini indi göndər:",
    },
    "ielts_text_too_short": {
        "en": "⚠️ Text too short for evaluation (minimum 50 characters).",
        "ru": "⚠️ Текст слишком короткий для оценки (минимум 50 символов).",
        "az": "⚠️ Qiymətləndirmə üçün mətn çox qısadır (minimum 50 simvol).",
    },
    "ielts_evaluating": {
        "en": "📊 Evaluating your writing...",
        "ru": "📊 Оцениваю ваше письмо...",
        "az": "📊 Yazınız qiymətləndirilir...",
    },
    "ielts_results": {
        "en": "📊 IELTS Evaluation Results",
        "ru": "📊 Результаты оценки IELTS",
        "az": "📊 IELTS Qiymətləndirmə Nəticələri",
    },
    "ielts_overall_score": {
        "en": "Overall Band Score",
        "ru": "Общий балл",
        "az": "Ümumi Bant Xalı",
    },
    "task_response": {
        "en": "Task Response",
        "ru": "Task Response",
        "az": "Task Response",
    },
    "coherence_cohesion": {
        "en": "Coherence & Cohesion",
        "ru": "Coherence & Cohesion",
        "az": "Coherence & Cohesion",
    },
    "lexical_resource": {
        "en": "Lexical Resource",
        "ru": "Lexical Resource",
        "az": "Lexical Resource",
    },
    "grammatical_range": {
        "en": "Grammatical Range",
        "ru": "Grammatical Range",
        "az": "Grammatical Range",
    },
    "ielts_overall_feedback": {
        "en": "Overall Feedback",
        "ru": "Общая обратная связь",
        "az": "Ümumi Rəy",
    },
    "ielts_error": {
        "en": "⚠️ Could not evaluate your text. Please try again.",
        "ru": "⚠️ Не удалось оценить текст. Попробуйте еще раз.",
        "az": "⚠️ Mətniniz qiymətləndirilə bilmədi. Zəhmət olmasa yenidən cəhd edin.",
    },
    "ielts_fatal": {
        "en": "❌ Evaluation service unavailable. Please try later.",
        "ru": "❌ Сервис оценки недоступен. Попробуйте позже.",
        "az": "❌ Qiymətləndirmə xidməti mövcud deyil. Zəhmət olmasa sonra cəhd edin.",
    },

    # /ask
    "ask_title": {
        "en": "❓ Grammar & Language Help",
        "ru": "❓ Помощь по грамматике и языку",
        "az": "❓ Qrammatika və Dil Köməyi",
    },
    "ask_instructions": {
        "en": "Ask me anything about grammar, vocabulary, pronunciation, or language learning! I'll provide detailed explanations with examples.\n\nExamples:\n• \"When do I use 'a' vs 'an'?\"\n• \"How to remember irregular verbs?\"\n• \"What's the difference between 'say' and 'tell'?\"",
        "ru": "Спрашивайте меня всё о грамматике, лексике, произношении или изучении языка! Я дам подробные объяснения с примерами.\n\nПримеры:\n• \"Когда использовать 'a' vs 'an'?\"\n• \"Как запомнить неправильные глаголы?\"\n• \"В чем разница между 'say' и 'tell'?\"",
        "az": "Qrammatika, lüğət, tələffüz və ya dil öyrənmə haqqında hər şeyi soruşa bilərsiniz! Mən nümunələrlə detallı izahlar verəcəm.\n\nNümunələr:\n• \"'a' və 'an' nə vaxt istifadə edirəm?\"\n• \"Qeyri-adi felləri necə yadda saxlamaq olar?\"\n• \"'say' və 'tell' arasında nə fərq var?\"",
    },
    "ask_send_question": {
        "en": "📤 Send your question now:",
        "ru": "📤 Отправьте ваш вопрос:",
        "az": "📤 Sualınızı indi göndərin:",
    },
    "ask_thinking": {
        "en": "🤔 Thinking about your question...",
        "ru": "🤔 Думаю над вашим вопросом...",
        "az": "🤔 Sualınız haqqında düşünürəm...",
    },
    "ask_answer": {
        "en": "Answer to your question",
        "ru": "Ответ на ваш вопрос",
        "az": "Sualınızın cavabı",
    },
    "ask_explanation": {
        "en": "Explanation",
        "ru": "Объяснение",
        "az": "İzah",
    },
    "ask_examples": {
        "en": "Examples",
        "ru": "Примеры",
        "az": "Nümunələr",
    },
    "ask_tips": {
        "en": "Learning Tips",
        "ru": "Советы по изучению",
        "az": "Öyrənmə Məsləhətləri",
    },
    "ask_mistakes": {
        "en": "Common Mistakes",
        "ru": "Распространенные ошибки",
        "az": "Adi Səhvlər",
    },
    "ask_error": {
        "en": "⚠️ Could not answer your question. Please try again.",
        "ru": "⚠️ Не удалось ответить на вопрос. Попробуйте еще раз.",
        "az": "⚠️ Sualınıza cavab verila bilmədi. Zəhmət olmasa yenidən cəhd edin.",
    },
    "ask_fatal": {
        "en": "❌ Help service unavailable. Please try later.",
        "ru": "❌ Сервис помощи недоступен. Попробуйте позже.",
        "az": "❌ Kömək xidməti mövcud deyil. Zəhmət olmasa sonra cəhd edin.",
    },
    "chat_cleared": {
        "en": "🗑 Chat history cleared. Start a new conversation!",
        "ru": "🗑 История чата очищена. Начни новый разговор!",
        "az": "🗑 Söhbət tarixçəsi silindi. Yeni söhbətə başla!",
    },

    # Delete
    "delete_usage": {
        "en": "Usage: /delete <word>",
        "ru": "Использование: /delete <слово>",
        "az": "İstifadə: /delete <söz>",
    },

    # Reminders
    "reminder_title": {
        "en": "🔔 <b>Review Reminder</b>",
        "ru": "🔔 <b>Напоминание о повторении</b>",
        "az": "🔔 <b>Təkrar Xatırlatması</b>",
    },
    "reminder_body": {
        "en": "You have <b>{count}</b> words due for review. Use /quiz to practice!",
        "ru": "У тебя <b>{count}</b> слов на повторение. Используй /quiz для практики!",
        "az": "Təkrar üçün <b>{count}</b> sözün var. Məşq üçün /quiz istifadə et!",
    },
    "wotd_title": {
        "en": "🌟 <b>Word of the Day</b>",
        "ru": "🌟 <b>Слово дня</b>",
        "az": "🌟 <b>Günün Sözü</b>",
    },

    # Quiz
    "btn_classic": {
        "en": "🔤 Word → Translation",
        "ru": "🔤 Слово → Перевод",
        "az": "🔤 Söz → Tərcümə",
    },
    "btn_reverse": {
        "en": "🔄 Translation → Word",
        "ru": "🔄 Перевод → Слово",
        "az": "🔄 Tərcümə → Söz",
    },
    "btn_choices": {
        "en": "🅰️ Multiple Choice",
        "ru": "🅰️ Выбор из вариантов",
        "az": "🅰️ Çoxlu Seçim",
    },
    "quiz_choose_mode": {
        "en": "🧠 <b>Choose quiz mode:</b>",
        "ru": "🧠 <b>Выбери режим квиза:</b>",
        "az": "🧠 <b>Quiz rejimini seç:</b>",
    },
    "quiz_finished": {
        "en": "🏁 <b>Quiz finished!</b> You've gone through all your words.",
        "ru": "🏁 <b>Квиз завершён!</b> Ты прошёл все слова.",
        "az": "🏁 <b>Quiz bitdi!</b> Bütün sözlərini keçdin.",
    },
    "quiz_paused": {
        "en": "⏸ <b>Quiz paused.</b> Use /cancel to exit.",
        "ru": "⏸ <b>Квиз приостановлен.</b> Используй /cancel для выхода.",
        "az": "⏸ <b>Quiz dayandırıldı.</b> Çıxmaq üçün /cancel istifadə et.",
    },
    "quiz_cancelled": {
        "en": "❌ <b>Quiz cancelled.</b>",
        "ru": "❌ <b>Квиз отменён.</b>",
        "az": "❌ <b>Quiz ləğv edildi.</b>",
    },
    "quiz_continue": {
        "en": "🔄 <b>Want to continue?</b>",
        "ru": "🔄 <b>Хочешь продолжить?</b>",
        "az": "🔄 <b>Davam etmək istəyirsən?</b>",
    },
    "quiz_question": {
        "en": "🎯 <b>Question {current}/{total}</b>\n\n📖 <b>{word}</b>",
        "ru": "🎯 <b>Вопрос {current}/{total}</b>\n\n📖 <b>{word}</b>",
        "az": "🎯 <b>Sual {current}/{total}</b>\n\n📖 <b>{word}</b>",
    },
    "quiz_correct": {
        "en": "✅ <b>Correct!</b> 🎉",
        "ru": "✅ <b>Правильно!</b> 🎉",
        "az": "✅ <b>Doğru!</b> 🎉",
    },
    "quiz_wrong": {
        "en": "❌ <b>Wrong!</b>",
        "ru": "❌ <b>Неправильно!</b>",
        "az": "❌ <b>Yanlış!</b>",
    },
    "quiz_skipped": {
        "en": "⏭ <b>Skipped!</b> 📖 Correct answer: <b>{answer}</b>",
        "ru": "⏭ <b>Пропущено!</b> 📖 Правильный ответ: <b>{answer}</b>",
        "az": "⏭ <b>Ötərildi!</b> 📖 Düzgün cavab: <b>{answer}</b>",
    },
    "quiz_classic_q": {
        "en": "🎯 Translate this word:\n\n📖 <b>{word}</b>",
        "ru": "🎯 Переведи это слово:\n\n📖 <b>{word}</b>",
        "az": "🎯 Bu sözü tərcümə et:\n\n📖 <b>{word}</b>",
    },
    "quiz_reverse_q": {
        "en": "🎯 What word matches this translation?\n\n🌐 <b>{translation}</b>",
        "ru": "🎯 Какое слово соответствует переводу?\n\n🌐 <b>{translation}</b>",
        "az": "🎯 Bu tərcüməyə hansı söz uyğundur?\n\n🌐 <b>{translation}</b>",
    },
    "quiz_choices_q": {
        "en": "🎯 Choose the correct translation:\n\n📖 <b>{word}</b>",
        "ru": "🎯 Выбери правильный перевод:\n\n📖 <b>{word}</b>",
        "az": "🎯 Düzgün tərcüməni seç:\n\n📖 <b>{word}</b>",
    },
    "quiz_no_words": {
        "en": "📚 You don't have any words yet. Send me a word to get started!",
        "ru": "📚 У тебя пока нет слов. Отправь мне слово, чтобы начать!",
        "az": "📚 Hələ sözün yoxdur. Başlamaq üçün mənə bir söz göndər!",
    },
    "quiz_no_active": {
        "en": "No active quiz. Use /quiz to start one.",
        "ru": "Нет активного квиза. Используй /quiz чтобы начать.",
        "az": "Aktiv quiz yoxdur. Başlamaq üçün /quiz istifadə et.",
    },
    "quiz_ended": {
        "en": "❌ <b>Quiz ended.</b>",
        "ru": "❌ <b>Квиз завершён.</b>",
        "az": "❌ <b>Quiz bitdi.</b>",
    },
    "quiz_streak": {
        "en": "🔥 Streak: <b>{count}</b> correct in a row!",
        "ru": "🔥 Серия: <b>{count}</b> правильных подряд!",
        "az": "🔥 Seriya: ardıcıl <b>{count}</b> doğru!",
    },
    "quiz_correct_answer": {
        "en": "📖 Correct answer: <b>{answer}</b>",
        "ru": "📖 Правильный ответ: <b>{answer}</b>",
        "az": "📖 Düzgün cavab: <b>{answer}</b>",
    },
    "quiz_your_answer": {
        "en": "✏️ Your answer: <b>{answer}</b>",
        "ru": "✏️ Твой ответ: <b>{answer}</b>",
        "az": "✏️ Sənin cavabın: <b>{answer}</b>",
    },

    # Word processing
    "word_looking_up": {
        "en": "🔍 Looking up word...",
        "ru": "🔍 Ищу слово...",
        "az": "🔍 Söz axtarılır...",
    },
    "word_added": {
        "en": "✅ Word added to your vocabulary!",
        "ru": "✅ Слово добавлено в словарь!",
        "az": "✅ Söz lüğətinə əlavə edildi!",
    },
    "word_exists": {
        "en": "ℹ️ Word already in your vocabulary.",
        "ru": "ℹ️ Слово уже есть в словаре.",
        "az": "ℹ️ Söz artıq lüğətdə var.",
    },
    "word_too_long": {
        "en": "⚠️ Text too long (maximum 500 characters).",
        "ru": "⚠️ Текст слишком длинный (максимум 500 символов).",
        "az": "⚠️ Mətn çox uzundur (maksimum 500 simvol).",
    },
    "word_error": {
        "en": "⚠️ Could not process word. Please try again.",
        "ru": "⚠️ Не удалось обработать слово. Попробуйте еще раз.",
        "az": "⚠️ Söz emlə oluna bilmədi. Zəhmət olmasa yenidən cəhd edin.",
    },
    "word_fatal": {
        "en": "❌ Service unavailable. Please try later.",
        "ru": "❌ Сервис недоступен. Попробуйте позже.",
        "az": "❌ Xidmət mövcud deyil. Zəhmət olmasa sonra cəhd edin.",
    },

    # Reverse translation
    "reverse_translation_title": {
        "en": "Translation options for {word}",
        "ru": "Варианты перевода для {word}",
        "az": "{word} üçün tərcümə variantları",
    },
    "translations": {
        "en": "Translations",
        "ru": "Переводы",
        "az": "Tərcümələr",
    },
    "meanings": {
        "en": "Meanings",
        "ru": "Значения",
        "az": "Mənalar",
    },
    "examples": {
        "en": "Examples",
        "ru": "Примеры",
        "az": "Nümunələr",
    },
    "context": {
        "en": "When to use",
        "ru": "Когда использовать",
        "az": "Necə istifadə etmək",
    },
    # Section / Menu
    "menu_title": {
        "en": "📋 <b>Choose a section</b>\n\nSelect what you want to do:",
        "ru": "📋 <b>Выбери раздел</b>\n\nВыбери, что хочешь сделать:",
        "az": "📋 <b>Bölmə seç</b>\n\nNə etmək istədiyini seç:",
    },
    "section_words_active": {
        "en": "📖 <b>Word Lookup</b> mode active.\n\nSend me any word or phrase — I'll explain and save it.\nType /menu to switch sections.",
        "ru": "📖 Режим <b>Поиска слов</b> активен.\n\nОтправь мне слово или фразу — я объясню и сохраню.\nНабери /menu для смены раздела.",
        "az": "📖 <b>Söz Axtarışı</b> rejimi aktivdir.\n\nMənə söz və ya ifadə göndər — izah edərəm və saxlayacağam.\nBölmə dəyişmək üçün /menu yaz.",
    },
    "section_grammar_active": {
        "en": "❓ <b>Grammar Q&A</b> mode active.\n\nAsk me anything about grammar, vocabulary, or language learning!\nType /menu to switch sections.",
        "ru": "❓ Режим <b>Вопросов по грамматике</b> активен.\n\nСпрашивай о грамматике, лексике или изучении языка!\nНабери /menu для смены раздела.",
        "az": "❓ <b>Qrammatika Sual-Cavab</b> rejimi aktivdir.\n\nQrammatika, lüğət və ya dil öyrənmə haqqında soruş!\nBölmə dəyişmək üçün /menu yaz.",
    },
    "section_ielts_active": {
        "en": "📝 <b>IELTS Writing</b> mode active.\n\nSend me your essay or text — I'll evaluate it by IELTS criteria.\nType /menu to switch sections.",
        "ru": "📝 Режим <b>IELTS Writing</b> активен.\n\nОтправь мне эссе или текст — я оценю по критериям IELTS.\nНабери /menu для смены раздела.",
        "az": "📝 <b>IELTS Writing</b> rejimi aktivdir.\n\nMənə esse və ya mətn göndər — IELTS meyarlarına görə qiymətləndirəcəm.\nBölmə dəyişmək üçün /menu yaz.",
    },
    "no_section": {
        "en": "🤔 Please choose a section first! Use /menu or tap a button below.",
        "ru": "🤔 Сначала выбери раздел! Набери /menu или нажми кнопку ниже.",
        "az": "🤔 Əvvəlcə bölmə seç! /menu yaz və ya aşağıdakı düyməyə toxun.",
    },
}


# ─── Public API ───────────────────────────────────────────────────────────────

def get_translator(language: str) -> callable:
    """Return a translation function for the given language code.

    Args:
        language: Language code (e.g., "en", "ru", "az").

    Returns:
        A function ``t(key, **kwargs)`` that returns the translated string
        with any ``{placeholder}`` values interpolated from ``kwargs``.
    """
    if language not in UI_LANGUAGES:
        language = "en"  # fallback to English

    def t(key: str, **kwargs) -> str:
        """Translate a string key, interpolating any provided kwargs."""
        if key not in _STRINGS:
            return f"[{key}]"  # missing key fallback

        string = _STRINGS[key].get(language, _STRINGS[key].get("en", f"[{key}]"))
        return string.format(**kwargs) if kwargs else string

    return t
