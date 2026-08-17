"""Shared catalogs used by both the Telegram bot and the web platform."""

# Native / translation languages
LANGUAGES: dict[str, str] = {
    "Russian": "🇷🇺 Русский",
    "Azerbaijani": "🇦🇿 Azərbaycanca",
    "English": "🇬🇧 English",
}

# Languages available for learning
LEARNING_LANGUAGES: dict[str, str] = {
    "English": "🇬🇧 English",
    "Russian": "🇷🇺 Русский",
    "Azerbaijani": "🇦🇿 Azərbaycanca",
}

# Quiz modes
MODE_CLASSIC = "classic"        # word → type the translation
MODE_REVERSE = "reverse"        # translation → type the word
MODE_CHOICES = "choices"        # word → pick from options
QUIZ_MODES = (MODE_CLASSIC, MODE_REVERSE, MODE_CHOICES)
