import logging
import re
from dataclasses import dataclass

from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = """You are a language teacher helping students learn vocabulary.

The student is learning: {learning_language}
The student sent: "{word}"
The student's native language is: {native_language}

IMPORTANT: If the word is misspelled, correct it. In the "Word:" field always return the CORRECT {learning_language} spelling.
If the word has multiple meanings, list ALL common meanings numbered (1. 2. 3.) in both Translation and Meaning fields.

Return STRICTLY in this format (no extra text, no markdown):

Word: <the correctly spelled word or phrase in {learning_language}>
Translation: <all translations to {native_language}, numbered if multiple: 1. ... 2. ... 3. ...>
Meaning: <all definitions in {learning_language}, numbered if multiple: 1. ... 2. ... 3. ...>
Example: <example sentence using the word in {learning_language}>
Simple Explanation: <easy explanation in simple {learning_language}>
Level: <CEFR level: A1, A2, B1, B2, C1, or C2>
Synonyms: <exactly 3 synonyms in {learning_language}, comma-separated>"""

# New prompt for reverse translation (native -> learning language)
REVERSE_PROMPT_TEMPLATE = """You are a language teacher helping students learn vocabulary.

The student is learning: {learning_language}
The student sent: "{word}" in their native language: {native_language}

IMPORTANT: Provide multiple translation options from {native_language} to {learning_language}. 
If the phrase has multiple meanings, provide ALL common translations numbered (1. 2. 3.).

Return STRICTLY in this format (no extra text, no markdown):

Word: <the original word/phrase in {native_language}>
Translations: <all translations to {learning_language}, numbered: 1. ... 2. ... 3. ...>
Meanings: <explanations of each translation in {learning_language}, numbered to match: 1. ... 2. ... 3. ...>
Examples: <example sentences for each translation in {learning_language}, numbered: 1. ... 2. ... 3. ...>
Context: <explain when to use each translation, numbered: 1. ... 2. ... 3. ...>"""


@dataclass(frozen=True)
class WordExplanation:
    """Structured result from AI word explanation."""

    word: str
    translation: str
    meaning: str
    example: str
    simple_explanation: str
    level: str
    synonyms: str


@dataclass(frozen=True)
class ReverseTranslation:
    """Structured result for reverse translation (native -> learning language)."""

    word: str
    translations: str
    meanings: str
    examples: str
    context: str


class GroqService:
    """Service for interacting with Groq API."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        logger.info("GroqService initialized with model: %s", self._model)

    async def explain_word(
        self,
        word: str,
        language: str = "Russian",
        learning_language: str = "English",
    ) -> WordExplanation:
        """Send a word to Groq and return a structured explanation.

        Args:
            word: The word or phrase to explain.
            language: User's native language for translations.
            learning_language: The language the user is learning.

        Returns:
            WordExplanation with parsed fields.

        Raises:
            ValueError: If the response cannot be parsed.
            Exception: On API communication errors.
        """
        prompt = PROMPT_TEMPLATE.format(
            word=word,
            native_language=language,
            learning_language=learning_language,
        )
        logger.debug("Sending prompt to Groq for word: %s", word)

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=512,
            )
            raw_text = response.choices[0].message.content.strip()
            logger.debug("Groq raw response:\n%s", raw_text)
            return self._parse_response(raw_text, word)
        except Exception:
            logger.exception("Groq API call failed for word: %s", word)
            raise

    @staticmethod
    def _parse_response(text: str, original_word: str) -> WordExplanation:
        """Parse the structured text response from Groq into a WordExplanation.

        Extracts multi-line field values (e.g. numbered meanings) by capturing
        everything between one label and the next.
        """
        # Ordered list of fields as they appear in the prompt
        field_labels = [
            ("word", "Word"),
            ("translation", "Translation"),
            ("meaning", "Meaning"),
            ("example", "Example"),
            ("simple_explanation", "Simple Explanation"),
            ("level", "Level"),
            ("synonyms", "Synonyms"),
        ]

        # Build a regex that captures content between labels (including multi-line)
        label_names = [label for _, label in field_labels]
        parsed: dict[str, str] = {}
        for i, (key, label) in enumerate(field_labels):
            # Match from "Label:" up to the next label or end of text
            if i < len(field_labels) - 1:
                next_labels = "|".join(
                    re.escape(lb) for _, lb in field_labels[i + 1:]
                )
                pattern = rf"{re.escape(label)}:\s*(.*?)(?=\n\s*(?:{next_labels}):|\Z)"
            else:
                pattern = rf"{re.escape(label)}:\s*(.*)"
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                if value:
                    parsed[key] = value

        # Validate that essential fields are present
        missing = [k for k in ("translation", "meaning", "example", "simple_explanation") if k not in parsed]
        if missing:
            logger.warning(
                "Groq response missing fields %s for word '%s'. Raw:\n%s",
                missing,
                original_word,
                text,
            )
            raise ValueError(f"Could not parse Groq response. Missing fields: {missing}")

        return WordExplanation(
            word=parsed.get("word", original_word),
            translation=parsed["translation"],
            meaning=parsed["meaning"],
            example=parsed["example"],
            simple_explanation=parsed["simple_explanation"],
            level=parsed.get("level", "N/A"),
            synonyms=parsed.get("synonyms", ""),
        )

    async def reverse_translate(
        self,
        word: str,
        language: str = "Russian",
        learning_language: str = "English",
    ) -> ReverseTranslation:
        """Translate from native language to learning language with multiple options.

        Args:
            word: The word/phrase in native language to translate.
            language: User's native language.
            learning_language: The language the user is learning.

        Returns:
            ReverseTranslation with multiple translation options.

        Raises:
            ValueError: If the response cannot be parsed.
            Exception: On API communication errors.
        """
        prompt = REVERSE_PROMPT_TEMPLATE.format(
            word=word,
            native_language=language,
            learning_language=learning_language,
        )
        logger.debug("Sending reverse translation prompt to Groq for: %s", word)

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=512,
            )
            raw_text = response.choices[0].message.content.strip()
            logger.debug("Groq reverse translation raw response:\n%s", raw_text)
            return self._parse_reverse_response(raw_text, word)
        except Exception:
            logger.exception("Groq reverse translation API call failed for: %s", word)
            raise

    @staticmethod
    def _parse_reverse_response(text: str, original_word: str) -> ReverseTranslation:
        """Parse the reverse translation response from Groq."""
        field_labels = [
            ("word", "Word"),
            ("translations", "Translations"),
            ("meanings", "Meanings"),
            ("examples", "Examples"),
            ("context", "Context"),
        ]

        parsed: dict[str, str] = {}
        for i, (key, label) in enumerate(field_labels):
            if i < len(field_labels) - 1:
                next_labels = "|".join(
                    re.escape(lb) for _, lb in field_labels[i + 1:]
                )
                pattern = rf"{re.escape(label)}:\s*(.*?)(?=\n\s*(?:{next_labels}):|\Z)"
            else:
                pattern = rf"{re.escape(label)}:\s*(.*)"
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                value = match.group(1).strip()
                if value:
                    parsed[key] = value

        # Validate essential fields
        missing = [k for k in ("translations", "meanings", "examples", "context") if k not in parsed]
        if missing:
            logger.warning(
                "Groq reverse response missing fields %s for word '%s'. Raw:\n%s",
                missing,
                original_word,
                text,
            )
            raise ValueError(f"Could not parse reverse translation response. Missing fields: {missing}")

        return ReverseTranslation(
            word=parsed.get("word", original_word),
            translations=parsed["translations"],
            meanings=parsed["meanings"],
            examples=parsed["examples"],
            context=parsed["context"],
        )


# Module-level singleton
groq_service = GroqService()
