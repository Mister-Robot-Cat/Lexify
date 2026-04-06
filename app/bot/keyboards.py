from telegram import InlineKeyboardButton, InlineKeyboardMarkup

# Callback data prefixes
QUIZ_START = "quiz_start"
QUIZ_SKIP = "quiz_skip"
QUIZ_MODE = "quiz_mode"
QUIZ_CHOICE = "quiz_choice"
LIBRARY_PAGE = "lib_page"
SET_LANG = "set_lang"
SET_UI = "set_ui"
SET_LEARN = "set_learn"
TOPIC_SELECT = "topic"

# Quiz modes
MODE_CLASSIC = "classic"        # EN word → type translation
MODE_REVERSE = "reverse"        # translation → type EN word
MODE_CHOICES = "choices"        # EN word → pick from 4 buttons

# Supported target / native languages
LANGUAGES = {
    "Russian": "🇷🇺 Русский",
    "Azerbaijani": "�� Azərbaycanca",
    "English": "�� English"
}

# Languages available for learning
LEARNING_LANGUAGES = {
    "English": "🇬🇧 English",
    "Russian": "🇷🇺 Русский",
    "Azerbaijani": "🇦🇿 Azərbaycanca"
}


def quiz_mode_keyboard(
    label_classic: str = "🔤 Word → Translation",
    label_reverse: str = "🔄 Translation → Word",
    label_choices: str = "🅰️ Multiple Choice",
) -> InlineKeyboardMarkup:
    """Inline keyboard for quiz mode selection."""
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton(label_classic, callback_data=f"{QUIZ_MODE}:{MODE_CLASSIC}")],
            [InlineKeyboardButton(label_reverse, callback_data=f"{QUIZ_MODE}:{MODE_REVERSE}")],
            [InlineKeyboardButton(label_choices, callback_data=f"{QUIZ_MODE}:{MODE_CHOICES}")],
        ]
    )


def quiz_action_keyboard() -> InlineKeyboardMarkup:
    """Inline keyboard shown during an active quiz question."""
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("⏭ Skip", callback_data=QUIZ_SKIP),
            ]
        ]
    )


def quiz_choices_keyboard(options: list[str], correct_index: int) -> InlineKeyboardMarkup:
    """Inline keyboard with 4 answer options for multiple-choice mode."""
    buttons = []
    for i, option in enumerate(options):
        buttons.append(
            [InlineKeyboardButton(option, callback_data=f"{QUIZ_CHOICE}:{i}")]
        )
    buttons.append(
        [InlineKeyboardButton("⏭ Skip", callback_data=QUIZ_SKIP)]
    )
    return InlineKeyboardMarkup(buttons)


def main_menu_keyboard() -> InlineKeyboardMarkup:
    """Inline keyboard for the main menu after /start."""
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("🎯 Quiz", callback_data=QUIZ_START),
            ],
        ]
    )


def language_keyboard(current_lang: str = "Russian") -> InlineKeyboardMarkup:
    """Inline keyboard for language selection. Marks the current language with ✅."""
    buttons = []
    row: list[InlineKeyboardButton] = []
    for lang_key, lang_label in LANGUAGES.items():
        marker = " ✅" if lang_key == current_lang else ""
        row.append(
            InlineKeyboardButton(
                f"{lang_label}{marker}",
                callback_data=f"{SET_LANG}:{lang_key}",
            )
        )
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return InlineKeyboardMarkup(buttons)


def ui_language_keyboard(current: str = "en") -> InlineKeyboardMarkup:
    """Inline keyboard for UI language selection."""
    from app.bot.i18n_simple import UI_LANGUAGES
    buttons = []
    row: list[InlineKeyboardButton] = []
    for code, label in UI_LANGUAGES.items():
        marker = " ✅" if code == current else ""
        row.append(
            InlineKeyboardButton(f"{label}{marker}", callback_data=f"{SET_UI}:{code}")
        )
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return InlineKeyboardMarkup(buttons)


def learning_language_keyboard(current: str = "English") -> InlineKeyboardMarkup:
    """Inline keyboard for learning language selection."""
    buttons = []
    row: list[InlineKeyboardButton] = []
    for lang_key, lang_label in LEARNING_LANGUAGES.items():
        marker = " ✅" if lang_key == current else ""
        row.append(
            InlineKeyboardButton(
                f"{lang_label}{marker}",
                callback_data=f"{SET_LEARN}:{lang_key}",
            )
        )
        if len(row) == 2:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    return InlineKeyboardMarkup(buttons)


def topics_keyboard() -> InlineKeyboardMarkup:
    """Inline keyboard for themed word pack selection."""
    from app.bot.topics import TOPIC_KEYS
    buttons = []
    for key, name in TOPIC_KEYS.items():
        buttons.append([InlineKeyboardButton(name, callback_data=f"{TOPIC_SELECT}:{key}")])
    return InlineKeyboardMarkup(buttons)


def library_pagination_keyboard(page: int, total_pages: int) -> InlineKeyboardMarkup | None:
    """Inline keyboard for library pagination. Returns None if only 1 page."""
    if total_pages <= 1:
        return None

    buttons: list[InlineKeyboardButton] = []

    if page > 0:
        buttons.append(
            InlineKeyboardButton("◀️ Prev", callback_data=f"{LIBRARY_PAGE}:{page - 1}")
        )

    buttons.append(
        InlineKeyboardButton(f"{page + 1}/{total_pages}", callback_data="noop")
    )

    if page < total_pages - 1:
        buttons.append(
            InlineKeyboardButton("Next ▶️", callback_data=f"{LIBRARY_PAGE}:{page + 1}")
        )

    return InlineKeyboardMarkup([buttons])
