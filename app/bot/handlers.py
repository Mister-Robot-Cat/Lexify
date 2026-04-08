import logging
import random as _random

from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)
from sqlalchemy import select, delete

from app.bot.i18n_simple import get_translator, UI_LANGUAGES
from app.bot.keyboards import (
    LANGUAGES,
    LEARNING_LANGUAGES,
    LIBRARY_PAGE,
    MODE_CHOICES,
    MODE_CLASSIC,
    MODE_REVERSE,
    QUIZ_CHOICE,
    QUIZ_MODE,
    QUIZ_SKIP,
    QUIZ_START,
    SECTION_SELECT,
    SET_LANG,
    SET_LEARN,
    SET_UI,
    TOPIC_SELECT,
    WORD_DELETE,
    WORD_LIBRARY,
    WORD_MORE,
    WORD_QUIZ,
    language_keyboard,
    learning_language_keyboard,
    library_pagination_keyboard,
    main_menu_keyboard,
    quiz_action_keyboard,
    quiz_choices_keyboard,
    quiz_mode_keyboard,
    section_menu_keyboard,
    topics_keyboard,
    ui_language_keyboard,
    word_actions_keyboard,
)
from app.bot.topics import TOPIC_KEYS, TOPIC_PACKS
from app.bot.user_state import (
    Section, get_section, set_section, clear_section,
    get_chat_history, append_chat_message, clear_chat_history,
)
from app.database.session import async_session_factory
from app.services.groq_service import WordExplanation, ReverseTranslation
from app.services.ask_service import ask_service
from app.services.ielts_service import ielts_service
from app.services.quiz_service import quiz_service
from app.services.word_service import word_service

logger = logging.getLogger(__name__)

# ConversationHandler states
AWAITING_ANSWER = 1


# ─── Helper ──────────────────────────────────────────────────────────────────

async def _get_ui_lang(telegram_id: int) -> str:
    """Fetch the user's UI language code from the DB."""
    async with async_session_factory() as session:
        return await word_service.get_ui_language(session, telegram_id)


def _h(text: str) -> str:
    """Escape HTML special characters for Telegram HTML parse mode."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _format_word_html(word, show_synonyms: bool = True) -> str:
    """Format a Word model into a Telegram HTML message."""
    parts = [
        f"📖 <b>{_h(word.word)}</b>  [{_h(word.level)}]\n",
        f"🌐 <b>Translation:</b>\n    {_h(word.translation)}",
        f"📝 <b>Meaning:</b>\n    {_h(word.meaning)}",
        f"💬 <b>Example:</b> <i>{_h(word.example)}</i>",
        f"💡 <b>Simple Explanation:</b> {_h(word.simple_explanation)}",
    ]
    if show_synonyms and word.synonyms:
        # Format synonyms nicely - split by comma and show first 3
        synonyms_list = [s.strip() for s in word.synonyms.split(",") if s.strip()]
        if synonyms_list:
            top_synonyms = synonyms_list[:3]
            synonyms_text = ", ".join(f"<code>{_h(s)}</code>" for s in top_synonyms)
            parts.append(f"\n🔗 <b>Synonyms:</b> {synonyms_text}")
    return "\n".join(parts)


# ─── /start ──────────────────────────────────────────────────────────────────

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command — welcome the user and show section menu."""
    user = update.effective_user
    logger.info("/start from user %s (id=%d)", user.username, user.id)
    set_section(user.id, Section.WORDS)  # Default to word lookup

    async with async_session_factory() as session:
        db_user = await word_service.get_or_create_user(session, user.id)
        ui_lang = db_user.ui_language
        await session.commit()

    t = get_translator(ui_lang)
    name = _h(user.first_name)
    text = t("welcome", name=name)
    await update.message.reply_text(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=section_menu_keyboard(),
    )


# ─── /progress ───────────────────────────────────────────────────────────────

async def progress_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /progress command — show user statistics."""
    user = update.effective_user
    logger.info("/progress from user %s (id=%d)", user.username, user.id)

    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    async with async_session_factory() as session:
        stats = await quiz_service.get_user_stats(session, user.id)
        await session.commit()

    accuracy = 0
    if stats["total_reviews"] > 0:
        accuracy = round(stats["total_correct"] / stats["total_reviews"] * 100)

    text = (
        f"{t('progress_title')}\n\n"
        f"{t('progress_words', count=str(stats['total_words']))}\n"
        f"{t('progress_correct', count=str(stats['total_correct']))}\n"
        f"{t('progress_wrong', count=str(stats['total_wrong']))}\n"
        f"{t('progress_accuracy', pct=str(accuracy))}\n"
        f"{t('progress_due', count=str(stats['due_for_review']))}"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)


# ─── /library ─────────────────────────────────────────────────────────────────

async def library_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /library command — show paginated vocabulary."""
    user = update.effective_user
    logger.info("/library from user %s (id=%d)", user.username, user.id)
    ui_lang = await _get_ui_lang(user.id)
    await _send_library_page(update.message, user.id, page=0, ui_lang=ui_lang)


async def library_page_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle library pagination button presses."""
    query = update.callback_query
    await query.answer()

    try:
        page = int(query.data.split(":")[1])
    except (IndexError, ValueError):
        page = 0

    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    await _send_library_page(query.message, user.id, page=page, edit=True, ui_lang=ui_lang)


async def _send_library_page(
    message, telegram_id: int, page: int = 0, edit: bool = False, ui_lang: str = "en"
) -> None:
    """Fetch and send a library page (new message or edit existing)."""
    t = get_translator(ui_lang)

    async with async_session_factory() as session:
        lib_page = await quiz_service.get_library_page(session, telegram_id, page)
        await session.commit()

    if lib_page.total_words == 0:
        text = t("library_empty")
        if edit:
            await message.edit_text(text, parse_mode=ParseMode.HTML)
        else:
            await message.reply_text(text, parse_mode=ParseMode.HTML)
        return

    lines = [
        t("library_title", count=str(lib_page.total_words)) + "\n",
    ]

    for i, (word, uw) in enumerate(lib_page.items, start=page * 5 + 1):
        lines.append(
            f"<b>{i}. {word.word}</b>\n"
            f"    🌐 {word.translation}\n"
            f"    💬 <i>{word.example}</i>"
        )

    text = "\n\n".join(lines)
    keyboard = library_pagination_keyboard(lib_page.page, lib_page.total_pages)

    if edit:
        await message.edit_text(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)
    else:
        await message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)


# ─── /language ────────────────────────────────────────────────────────────────

async def language_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /language command — show language selection keyboard."""
    user = update.effective_user
    logger.info("/language from user %s (id=%d)", user.username, user.id)

    async with async_session_factory() as session:
        db_user = await word_service.get_or_create_user(session, user.id)
        current_lang = db_user.language
        ui_lang = db_user.ui_language

    t = get_translator(ui_lang)
    await update.message.reply_text(
        t("language_title", current=LANGUAGES.get(current_lang, current_lang)),
        parse_mode=ParseMode.HTML,
        reply_markup=language_keyboard(current_lang),
    )


async def language_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle language selection button press."""
    query = update.callback_query
    await query.answer()

    try:
        chosen_lang = query.data.split(":")[1]
    except (IndexError, ValueError):
        return

    if chosen_lang not in LANGUAGES:
        return

    user = update.effective_user

    async with async_session_factory() as session:
        await word_service.set_user_language(session, user.id, chosen_lang)
        ui_lang = (await word_service.get_or_create_user(session, user.id)).ui_language
        await session.commit()

    t = get_translator(ui_lang)
    await query.edit_message_text(
        t("language_title", current=LANGUAGES[chosen_lang]),
        parse_mode=ParseMode.HTML,
        reply_markup=language_keyboard(chosen_lang),
    )


# ─── /delete ──────────────────────────────────────────────────────────────────

async def delete_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /delete <word> — remove a word from the user's vocabulary."""
    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    args = context.args

    if not args:
        await update.message.reply_text(t("delete_usage"))
        return

    word_text = " ".join(args).strip()
    logger.info("/delete '%s' from user %s (id=%d)", word_text, user.username, user.id)

    async with async_session_factory() as session:
        deleted = await word_service.delete_user_word(session, user.id, word_text)
        await session.commit()

    if deleted:
        await update.message.reply_text(t("delete_ok", word=word_text), parse_mode=ParseMode.HTML)
    else:
        await update.message.reply_text(t("delete_not_found", word=word_text), parse_mode=ParseMode.HTML)


# ─── /menu — Section selector ────────────────────────────────────────────────

async def menu_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /menu command — show section selection menu and reset state."""
    user = update.effective_user
    clear_section(user.id)
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    await update.message.reply_text(
        t("menu_title"),
        parse_mode=ParseMode.HTML,
        reply_markup=section_menu_keyboard(),
    )


async def section_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle section selection from inline keyboard."""
    query = update.callback_query
    await query.answer()

    try:
        chosen = query.data.split(":")[1]
    except (IndexError, ValueError):
        return

    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    if chosen == "words":
        set_section(user.id, Section.WORDS)
        await query.edit_message_text(t("section_words_active"), parse_mode=ParseMode.HTML)
    elif chosen == "grammar":
        set_section(user.id, Section.GRAMMAR)
        await query.edit_message_text(t("section_grammar_active"), parse_mode=ParseMode.HTML)
    elif chosen == "ielts":
        set_section(user.id, Section.IELTS)
        await query.edit_message_text(t("section_ielts_active"), parse_mode=ParseMode.HTML)
    elif chosen == "quiz":
        set_section(user.id, Section.NONE)  # Quiz uses ConversationHandler
        await _quiz_mode_menu(user.id, query.message.reply_text)
    else:
        await query.edit_message_text(t("no_section"), reply_markup=section_menu_keyboard())


# ─── Section handlers (each processes text for its own section) ──────────────

async def _handle_words_section(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, t) -> None:
    """Process text in the Word Lookup section."""
    user = update.effective_user

    if len(text) > 200:
        await update.message.reply_text(t("word_too_long"))
        return

    logger.info("[WORDS] user %d: '%s'", user.id, text)
    await update.message.reply_text(t("word_looking_up"))

    try:
        # Show typing indicator during API/database operations
        await context.bot.send_chat_action(
            chat_id=update.effective_chat.id,
            action=ChatAction.TYPING
        )

        async with async_session_factory() as session:
            result, is_new = await word_service.process_word(session, user.id, text)
            await session.commit()

        if isinstance(result, ReverseTranslation):
            message = (
                f"🔤 <b>{t('reverse_translation_title', word=_h(result.word))}</b>\n\n"
                f"📝 <b>{t('translations')}</b>\n{_h(result.translations)}\n\n"
                f"📖 <b>{t('meanings')}</b>\n{_h(result.meanings)}\n\n"
                f"💬 <b>{t('examples')}</b>\n{_h(result.examples)}\n\n"
                f"ℹ️ <b>{t('context')}</b>\n{_h(result.context)}"
            )
            await update.message.reply_text(message, parse_mode=ParseMode.HTML)
        else:
            status = t("word_added") if is_new else t("word_exists")
            corrected = ""
            if result.word.lower() != text.lower():
                corrected = f"✏️ <b>Auto-corrected:</b> <s>{_h(text)}</s> → <b>{_h(result.word)}</b>\n\n"

            message = f"{corrected}{_format_word_html(result)}\n\n{status}"
            await update.message.reply_text(
                message,
                parse_mode=ParseMode.HTML,
                reply_markup=word_actions_keyboard(result.id),
            )

    except ValueError as e:
        logger.warning("Failed to process word '%s': %s", text, e)
        await update.message.reply_text(t("word_error"))
    except Exception:
        logger.exception("Unexpected error processing word '%s'", text)
        await update.message.reply_text(t("word_fatal"))


async def _handle_grammar_section(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, t) -> None:
    """Process text in the Grammar chatbot section."""
    user = update.effective_user
    logger.info("[GRAMMAR] user %d: %s", user.id, text[:80])
    await update.message.reply_text(t("ask_thinking"))

    try:
        # Show typing indicator during AI processing
        await context.bot.send_chat_action(
            chat_id=update.effective_chat.id,
            action=ChatAction.TYPING
        )

        async with async_session_factory() as session:
            db_user = await word_service.get_or_create_user(session, user.id)
            native_lang = db_user.language
            learning_lang = db_user.learning_language

        # Get conversation history for this user
        history = get_chat_history(user.id)

        # Send to chatbot with full history
        chat_response = await ask_service.chat(
            user_message=text,
            chat_history=history,
            native_language=native_lang,
            learning_language=learning_lang,
        )
        reply_text = chat_response.content

        # Save both messages to history
        append_chat_message(user.id, "user", text)
        append_chat_message(user.id, "assistant", reply_text)

        await update.message.reply_text(reply_text)

    except ValueError as e:
        logger.warning("Grammar chat error: %s", e)
        await update.message.reply_text(t("ask_error"))
    except Exception:
        logger.exception("Unexpected error in grammar chat")
        await update.message.reply_text(t("ask_fatal"))


async def _handle_ielts_section(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, t) -> None:
    """Process text in the IELTS Writing section."""
    user = update.effective_user

    if len(text) < 50:
        await update.message.reply_text(t("ielts_text_too_short"))
        return

    logger.info("[IELTS] user %d: %d characters", user.id, len(text))
    await update.message.reply_text(t("ielts_evaluating"))

    try:
        # Show typing indicator during evaluation (can take 5-10 seconds)
        await context.bot.send_chat_action(
            chat_id=update.effective_chat.id,
            action=ChatAction.TYPING
        )

        evaluation = await ielts_service.evaluate_writing(text)

        def _crit(emoji, name, crit):
            return (
                f"{emoji} <b>{name}</b>: {crit.score}/9\n"
                f"  ✅ {_h(crit.strengths)}\n"
                f"  ❌ {_h(crit.weaknesses)}\n"
                f"  💡 {_h(crit.suggestions)}"
            )

        message = (
            f"📊 <b>{t('ielts_results')}</b>\n\n"
            f"🎯 <b>{t('ielts_overall_score')}</b>: {evaluation.overall_score}/9\n\n"
            f"{_crit('📋', t('task_response'), evaluation.task_response)}\n\n"
            f"{_crit('🔗', t('coherence_cohesion'), evaluation.coherence_cohesion)}\n\n"
            f"{_crit('📚', t('lexical_resource'), evaluation.lexical_resource)}\n\n"
            f"{_crit('📝', t('grammatical_range'), evaluation.grammatical_range)}\n\n"
            f"💬 <b>{t('ielts_overall_feedback')}</b>\n{_h(evaluation.overall_feedback)}"
        )
        await update.message.reply_text(message, parse_mode=ParseMode.HTML)

    except ValueError as e:
        logger.warning("IELTS evaluation error: %s", e)
        await update.message.reply_text(t("ielts_error"))
    except Exception:
        logger.exception("Unexpected error in IELTS evaluation")
        await update.message.reply_text(t("ielts_fatal"))


# ─── Text router (routes messages based on user's current section) ───────────

async def text_router(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Route plain text messages to the correct section handler based on user state."""
    user = update.effective_user
    text = update.message.text.strip()
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    if not text or len(text) > 2000:
        await update.message.reply_text(t("word_too_long"))
        return

    section = get_section(user.id)

    # CRITICAL: When in QUIZ mode, text messages are handled ONLY by quiz_answer_handler
    # The quiz ConversationHandler is registered before text_router and will catch
    # quiz answers. If we reach here during quiz mode, it means quiz is not active.
    if section == Section.QUIZ:
        # User thinks they're in quiz but no active quiz question
        await update.message.reply_text(
            t("quiz_no_active"),
            parse_mode=ParseMode.HTML,
        )
        return

    if section == Section.WORDS:
        await _handle_words_section(update, context, text, t)
    elif section == Section.GRAMMAR:
        await _handle_grammar_section(update, context, text, t)
    elif section == Section.IELTS:
        await _handle_ielts_section(update, context, text, t)
    else:
        # No section selected — prompt user to choose
        await update.message.reply_text(
            t("no_section"),
            reply_markup=section_menu_keyboard(),
        )


# ─── Quiz flow (ConversationHandler) ─────────────────────────────────────────

async def _quiz_mode_menu(user_id: int, reply_func) -> int:
    """Show quiz mode selection keyboard (shared by command and button)."""
    ui_lang = await _get_ui_lang(user_id)
    t = get_translator(ui_lang)
    await reply_func(
        t("quiz_choose_mode"),
        parse_mode=ParseMode.HTML,
        reply_markup=quiz_mode_keyboard(
            label_classic=t("btn_classic"),
            label_reverse=t("btn_reverse"),
            label_choices=t("btn_choices"),
        ),
    )
    return ConversationHandler.END


async def quiz_command_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /quiz command — show mode selection."""
    return await _quiz_mode_menu(update.effective_user.id, update.message.reply_text)


async def quiz_start_from_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle the 'Quiz' button from main menu — show mode selection."""
    query = update.callback_query
    await query.answer()
    return await _quiz_mode_menu(update.effective_user.id, query.message.reply_text)


async def quiz_mode_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle quiz mode selection — start quiz with chosen mode."""
    query = update.callback_query
    await query.answer()
    user = update.effective_user

    try:
        mode = query.data.split(":")[1]
    except (IndexError, ValueError):
        mode = MODE_CLASSIC

    if mode not in (MODE_CLASSIC, MODE_REVERSE, MODE_CHOICES):
        mode = MODE_CLASSIC

    # CRITICAL: Set section to QUIZ to block translation handler
    set_section(user.id, Section.QUIZ)

    context.user_data["quiz_mode"] = mode
    context.user_data["quiz_asked"] = set()
    return await _send_quiz_question(update, context)


async def quiz_skip_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle the 'Skip' inline button during a quiz."""
    query = update.callback_query
    await query.answer()

    ui_lang = await _get_ui_lang(update.effective_user.id)
    t = get_translator(ui_lang)
    word_data = context.user_data.get("quiz_word")
    mode = context.user_data.get("quiz_mode", MODE_CLASSIC)

    if word_data:
        if mode == MODE_REVERSE:
            answer = word_data["word"]
        else:
            answer = word_data["translation"]
        await query.edit_message_text(
            t("quiz_skipped", answer=_h(answer)),
            parse_mode=ParseMode.HTML,
        )

    return await _send_quiz_question(update, context)


async def quiz_choice_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle a multiple-choice button press."""
    query = update.callback_query
    await query.answer()

    word_data = context.user_data.get("quiz_word")
    if not word_data:
        return ConversationHandler.END

    try:
        chosen_idx = int(query.data.split(":")[1])
    except (IndexError, ValueError):
        return AWAITING_ANSWER

    correct_idx = word_data.get("correct_index", 0)
    is_correct = chosen_idx == correct_idx
    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    async with async_session_factory() as session:
        user_word = await quiz_service.record_answer(
            session, user.id, word_data["word_id"], is_correct
        )
        await session.commit()

    if is_correct:
        text = (
            f"{t('quiz_correct')}\n\n"
            f"📖 <b>{_h(word_data['word'])}</b> — {_h(word_data['translation'])}\n"
            f"{t('quiz_streak', count=str(user_word.correct_count))}"
        )
    else:
        text = (
            f"{t('quiz_wrong')}\n\n"
            f"{t('quiz_correct_answer', answer=_h(word_data['translation']))}\n\n"
            f"📖 <b>{_h(word_data['word'])}</b>\n"
            f"💡 {_h(word_data['simple_explanation'])}"
        )

    await query.edit_message_text(text, parse_mode=ParseMode.HTML)
    return await _send_quiz_question(update, context)


async def quiz_answer_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle the user's text answer during an active quiz."""
    user = update.effective_user
    user_answer = update.message.text.strip()
    word_data = context.user_data.get("quiz_word")

    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    if not word_data:
        await update.message.reply_text(t("quiz_no_active"))
        return ConversationHandler.END

    mode = context.user_data.get("quiz_mode", MODE_CLASSIC)

    if mode == MODE_REVERSE:
        correct_answer = word_data["word"]
    else:
        correct_answer = word_data["translation"]

    is_correct = quiz_service.check_answer(user_answer, correct_answer)

    async with async_session_factory() as session:
        user_word = await quiz_service.record_answer(
            session, user.id, word_data["word_id"], is_correct
        )
        await session.commit()

    if is_correct:
        text = (
            f"{t('quiz_correct')}\n\n"
            f"📖 <b>{_h(word_data['word'])}</b> — {_h(word_data['translation'])}\n"
            f"{t('quiz_streak', count=str(user_word.correct_count))}"
        )
    else:
        text = (
            f"{t('quiz_wrong')}\n\n"
            f"{t('quiz_your_answer', answer=_h(user_answer))}\n"
            f"{t('quiz_correct_answer', answer=_h(correct_answer))}\n\n"
            f"📖 <b>{_h(word_data['word'])}</b>\n"
            f"💡 {_h(word_data['simple_explanation'])}"
        )

    await update.message.reply_text(text, parse_mode=ParseMode.HTML)
    return await _send_quiz_question(update, context)


async def _send_quiz_question(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Fetch the next due word and send it as a quiz question.

    Adapts question format based on quiz_mode stored in user_data.
    Returns AWAITING_ANSWER if a question was sent, or END if no words are due.
    """
    user = update.effective_user
    reply_func = (
        update.callback_query.message.reply_text
        if update.callback_query
        else update.message.reply_text
    )

    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    asked: set[int] = context.user_data.get("quiz_asked", set())
    mode = context.user_data.get("quiz_mode", MODE_CLASSIC)

    async with async_session_factory() as session:
        word = await quiz_service.get_word_for_quiz(session, user.id, exclude_word_ids=asked)

        if word is None:
            await session.commit()
            msg = t("quiz_finished") if asked else t("quiz_no_words")
            await reply_func(msg)
            context.user_data.pop("quiz_word", None)
            context.user_data.pop("quiz_asked", None)
            context.user_data.pop("quiz_mode", None)
            # CRITICAL: Clear QUIZ section to re-enable translation handler
            clear_section(user.id)
            return ConversationHandler.END

        # Track this word as asked
        asked.add(word.id)
        context.user_data["quiz_asked"] = asked

        # Get first translation line (short form for buttons/display)
        short_translation = word.translation.split("\n")[0].strip()
        if len(short_translation) > 3 and short_translation[0].isdigit() and short_translation[1] == ".":
            short_translation = short_translation[2:].strip()

        # Store current quiz word in user context
        quiz_data = {
            "word_id": word.id,
            "word": word.word,
            "translation": short_translation,
            "meaning": word.meaning,
            "simple_explanation": word.simple_explanation,
        }

        # Build question based on mode
        if mode == MODE_REVERSE:
            text = t("quiz_reverse_q", translation=_h(short_translation))
            keyboard = quiz_action_keyboard()

        elif mode == MODE_CHOICES:
            wrong_options = await quiz_service.get_choice_options(
                session, user.id, word, count=3
            )

            options = [short_translation] + wrong_options
            _random.shuffle(options)
            correct_index = options.index(short_translation)
            quiz_data["correct_index"] = correct_index

            text = t("quiz_choices_q", word=_h(word.word))
            keyboard = quiz_choices_keyboard(options, correct_index)

        else:  # MODE_CLASSIC
            text = t("quiz_classic_q", word=_h(word.word))
            keyboard = quiz_action_keyboard()

        await session.commit()

    context.user_data["quiz_word"] = quiz_data

    await reply_func(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=keyboard,
    )
    return AWAITING_ANSWER


async def quiz_cancel_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel the active quiz session."""
    user = update.effective_user
    context.user_data.pop("quiz_word", None)
    context.user_data.pop("quiz_asked", None)
    context.user_data.pop("quiz_mode", None)
    # CRITICAL: Clear QUIZ section to re-enable translation handler
    clear_section(user.id)
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    reply_func = (
        update.callback_query.message.reply_text
        if update.callback_query
        else update.message.reply_text
    )
    await reply_func(t("quiz_ended"))
    return ConversationHandler.END


# ─── /ui — Interface language ─────────────────────────────────────────────────

async def ui_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /ui command — show UI language selection keyboard."""
    user = update.effective_user
    logger.info("/ui from user %s (id=%d)", user.username, user.id)

    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    await update.message.reply_text(
        t("ui_title", current=UI_LANGUAGES.get(ui_lang, ui_lang)),
        parse_mode=ParseMode.HTML,
        reply_markup=ui_language_keyboard(ui_lang),
    )


async def ui_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle UI language selection button press."""
    query = update.callback_query
    await query.answer()

    try:
        chosen = query.data.split(":")[1]
    except (IndexError, ValueError):
        return

    if chosen not in UI_LANGUAGES:
        return

    user = update.effective_user
    async with async_session_factory() as session:
        await word_service.set_ui_language(session, user.id, chosen)
        await session.commit()

    t = get_translator(chosen)
    await query.edit_message_text(
        t("ui_title", current=UI_LANGUAGES[chosen]),
        parse_mode=ParseMode.HTML,
        reply_markup=ui_language_keyboard(chosen),
    )


# ─── /learning — Choose what language to learn ───────────────────────────────

async def learning_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /learning command — show learning language selection."""
    user = update.effective_user
    logger.info("/learning from user %s (id=%d)", user.username, user.id)

    async with async_session_factory() as session:
        db_user = await word_service.get_or_create_user(session, user.id)
        current = db_user.learning_language
        ui_lang = db_user.ui_language

    t = get_translator(ui_lang)
    await update.message.reply_text(
        t("learning_title", current=LEARNING_LANGUAGES.get(current, current)),
        parse_mode=ParseMode.HTML,
        reply_markup=learning_language_keyboard(current),
    )


async def learning_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle learning language selection button press."""
    query = update.callback_query
    await query.answer()

    try:
        chosen = query.data.split(":")[1]
    except (IndexError, ValueError):
        return

    if chosen not in LEARNING_LANGUAGES:
        return

    user = update.effective_user
    async with async_session_factory() as session:
        await word_service.set_learning_language(session, user.id, chosen)
        ui_lang = (await word_service.get_or_create_user(session, user.id)).ui_language
        await session.commit()

    t = get_translator(ui_lang)
    await query.edit_message_text(
        t("learning_title", current=LEARNING_LANGUAGES[chosen]),
        parse_mode=ParseMode.HTML,
        reply_markup=learning_language_keyboard(chosen),
    )


# ─── /topics — Themed word packs ─────────────────────────────────────────────

async def topics_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /topics command — show themed word packs."""
    user = update.effective_user
    logger.info("/topics from user %s (id=%d)", user.username, user.id)

    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    await update.message.reply_text(
        t("topics_title"),
        parse_mode=ParseMode.HTML,
        reply_markup=topics_keyboard(),
    )


async def topics_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle topic selection callback."""
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    ui_lang = await _get_ui_lang(user_id)
    t = get_translator(ui_lang)

    topic_key = query.data.split(":")[1]
    if topic_key not in TOPIC_KEYS:
        await query.edit_message_text(t("topic_error"))
        return

    topic_name = TOPIC_KEYS[topic_key]
    words = TOPIC_PACKS[topic_key]

    logger.info("User %d selected topic: %s (%d words)", user_id, topic_name, len(words))

    try:
        async with async_session_factory() as session:
            user = await word_service.get_or_create_user(session, user_id)
            added_count = 0

            for word_text in words:
                try:
                    word, created = await word_service.process_word(session, user_id, word_text)
                    if created:
                        added_count += 1
                except Exception:
                    logger.warning("Failed to add topic word '%s' for user %d", word_text, user_id)
                    continue

            await session.commit()

        message = t("topic_added", topic=topic_name, count=added_count, total=len(words))
        await query.edit_message_text(message)

    except Exception:
        logger.exception("Failed to process topic selection for user %d", user_id)
        await query.edit_message_text(t("topic_error"))


async def ask_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /ask command — switch to Grammar chatbot section (new conversation)."""
    user = update.effective_user
    set_section(user.id, Section.GRAMMAR)
    clear_chat_history(user.id)  # Start fresh conversation
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    await update.message.reply_text(t("section_grammar_active"), parse_mode=ParseMode.HTML)


async def clear_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /clear command — reset grammar chat history."""
    user = update.effective_user
    clear_chat_history(user.id)
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    await update.message.reply_text(t("chat_cleared"))


async def ielts_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /ielts command — switch to IELTS Writing section."""
    user = update.effective_user
    set_section(user.id, Section.IELTS)
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    await update.message.reply_text(t("section_ielts_active"), parse_mode=ParseMode.HTML)


# ─── Word action callbacks ───────────────────────────────────────────────────

async def word_quiz_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'Quiz' button click from word actions keyboard."""
    query = update.callback_query
    await query.answer()

    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    # Start quiz with the word included
    try:
        word_id = int(query.data.split(":")[1])
        context.user_data["quiz_mode"] = MODE_CLASSIC
        context.user_data["quiz_asked"] = {word_id}

        # Send quiz mode selection or directly start quiz
        await _send_quiz_question_from_callback(update, context, query.message.reply_text)
    except (IndexError, ValueError):
        await query.message.reply_text(t("quiz_no_words"))


async def _send_quiz_question_from_callback(update: Update, context: ContextTypes.DEFAULT_TYPE, reply_func) -> int:
    """Send next quiz question from callback context."""
    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)
    asked: set[int] = context.user_data.get("quiz_asked", set())
    mode = context.user_data.get("quiz_mode", MODE_CLASSIC)

    async with async_session_factory() as session:
        word = await quiz_service.get_word_for_quiz(session, user.id, exclude_word_ids=asked)

        if word is None:
            await session.commit()
            msg = t("quiz_finished") if asked else t("quiz_no_words")
            await reply_func(msg)
            context.user_data.pop("quiz_word", None)
            context.user_data.pop("quiz_asked", None)
            context.user_data.pop("quiz_mode", None)
            return ConversationHandler.END

        asked.add(word.id)
        context.user_data["quiz_asked"] = asked

        short_translation = word.translation.split("\n")[0].strip()
        if len(short_translation) > 3 and short_translation[0].isdigit() and short_translation[1] == ".":
            short_translation = short_translation[2:].strip()

        quiz_data = {
            "word_id": word.id,
            "word": word.word,
            "translation": short_translation,
            "meaning": word.meaning,
            "simple_explanation": word.simple_explanation,
        }

        if mode == MODE_REVERSE:
            text = t("quiz_reverse_q", translation=_h(short_translation))
            keyboard = quiz_action_keyboard()
        elif mode == MODE_CHOICES:
            wrong_options = await quiz_service.get_choice_options(session, user.id, word, count=3)
            options = [short_translation] + wrong_options
            _random.shuffle(options)
            correct_index = options.index(short_translation)
            quiz_data["correct_index"] = correct_index
            text = t("quiz_choices_q", word=_h(word.word))
            keyboard = quiz_choices_keyboard(options, correct_index)
        else:
            text = t("quiz_classic_q", word=_h(word.word))
            keyboard = quiz_action_keyboard()

        await session.commit()

    context.user_data["quiz_word"] = quiz_data

    await reply_func(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)
    return AWAITING_ANSWER


async def word_library_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'Library' button click from word actions keyboard."""
    query = update.callback_query
    await query.answer()

    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    await _send_library_page(query.message, user.id, page=0, edit=True, ui_lang=ui_lang)


async def word_delete_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'Delete' button click from word actions keyboard."""
    query = update.callback_query
    await query.answer()

    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    try:
        word_id = int(query.data.split(":")[1])

        async with async_session_factory() as session:
            # Get the word text first for confirmation message
            from app.database.models import Word, UserWord, User
            word_result = await session.execute(select(Word).where(Word.id == word_id))
            word = word_result.scalar_one_or_none()

            if word:
                # Get user id from telegram_id
                user_result = await session.execute(select(User).where(User.telegram_id == user.id))
                db_user = user_result.scalar_one_or_none()

                if db_user:
                    # Delete the user_word link
                    await session.execute(
                        delete(UserWord).where(
                            UserWord.user_id == db_user.id,
                            UserWord.word_id == word_id
                        )
                    )
                    await session.commit()
                    await query.edit_message_text(
                        t("delete_ok", word=word.word),
                        parse_mode=ParseMode.HTML
                    )
                else:
                    await query.edit_message_text(t("delete_not_found", word=""))
            else:
                await query.edit_message_text(t("delete_not_found", word=""))
    except Exception as e:
        logger.exception("Failed to delete word from callback")
        await query.message.reply_text(t("delete_error"))


async def word_more_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'More' button click — prompt to enter another word."""
    query = update.callback_query
    await query.answer()

    user = update.effective_user
    ui_lang = await _get_ui_lang(user.id)
    t = get_translator(ui_lang)

    await query.edit_message_text(
        f"{t('word_prompt_more')}\n\n{t('no_section')}",
        reply_markup=section_menu_keyboard(),
    )


# ─── Error handler ────────────────────────────────────────────────────────────

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log errors from the Telegram bot."""
    logger.error("Bot error: %s", context.error, exc_info=context.error)


# ─── Register all handlers ───────────────────────────────────────────────────

def register_handlers(application: Application) -> None:
    """Register all command, message, and callback handlers."""
    
    # Quiz conversation handler
    quiz_conv = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(quiz_mode_handler, pattern=f"^{QUIZ_MODE}:"),
        ],
        states={
            AWAITING_ANSWER: [
                CallbackQueryHandler(quiz_skip_handler, pattern=f"^{QUIZ_SKIP}$"),
                CallbackQueryHandler(quiz_choice_handler, pattern=f"^{QUIZ_CHOICE}:"),
                MessageHandler(filters.TEXT & ~filters.COMMAND, quiz_answer_handler),
            ],
        },
        fallbacks=[CommandHandler("cancel", quiz_cancel_handler)],
        allow_reentry=True,
    )

    # Commands
    application.add_handler(CommandHandler("start", start_handler))
    application.add_handler(CommandHandler("menu", menu_handler))
    application.add_handler(CommandHandler("quiz", quiz_command_handler))
    application.add_handler(CommandHandler("progress", progress_handler))
    application.add_handler(CommandHandler("library", library_handler))
    application.add_handler(CommandHandler("language", language_handler))
    application.add_handler(CommandHandler("delete", delete_handler))
    application.add_handler(CommandHandler("ui", ui_handler))
    application.add_handler(CommandHandler("learning", learning_handler))
    application.add_handler(CommandHandler("topics", topics_handler))
    application.add_handler(CommandHandler("ask", ask_handler))
    application.add_handler(CommandHandler("clear", clear_handler))
    application.add_handler(CommandHandler("ielts", ielts_handler))

    # Quiz conversation handler — MUST be registered BEFORE text_router
    # This ensures quiz answers are caught and not processed as translations
    application.add_handler(quiz_conv)

    # Text router — routes messages to correct section based on user state
    # CRITICAL: This handler MUST come AFTER quiz_conv to prevent quiz answers
    # from being processed as word translations when user is in quiz mode
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_router))

    # Callback handlers
    application.add_handler(CallbackQueryHandler(section_callback, pattern=f"^{SECTION_SELECT}:"))
    application.add_handler(CallbackQueryHandler(language_callback, pattern=f"^{SET_LANG}:"))
    application.add_handler(CallbackQueryHandler(ui_callback, pattern=f"^{SET_UI}:"))
    application.add_handler(CallbackQueryHandler(learning_callback, pattern=f"^{SET_LEARN}:"))
    application.add_handler(CallbackQueryHandler(topics_callback, pattern=f"^{TOPIC_SELECT}:"))

    # Word action callbacks
    application.add_handler(CallbackQueryHandler(word_quiz_callback, pattern=f"^{WORD_QUIZ}:"))
    application.add_handler(CallbackQueryHandler(word_library_callback, pattern=f"^{WORD_LIBRARY}:"))
    application.add_handler(CallbackQueryHandler(word_delete_callback, pattern=f"^{WORD_DELETE}:"))
    application.add_handler(CallbackQueryHandler(word_more_callback, pattern=f"^{WORD_MORE}$"))

    # Error handler
    application.add_error_handler(error_handler)

    logger.info("All bot handlers registered.")
