import logging
import re
from dataclasses import dataclass

from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = """<persona>
You are a precise vocabulary database engine. Your sole function: generate structured word explanations for language learners.
</persona>

<context>
Learning Language: {learning_language}
Native Language: {native_language}
Input Word: "{word}"
</context>

<task>
Generate a complete vocabulary entry for the input word. Correct spelling errors. Include all common meanings if multiple exist.
</task>

<language_constraints>
- Translation field: {native_language} ONLY
- All other fields: {learning_language} ONLY
- NO other languages permitted (no Chinese, Arabic, Japanese, etc.)
- NO mixing languages within any field
</language_constraints>

<format>
Return EXACTLY this structure (no markdown, no extra text, no commentary):

Word: <correct spelling in {learning_language}>
Translation: <{native_language} translation; numbered list 1. 2. 3. if multiple meanings>
Meaning: <definition(s) in {learning_language}; numbered list if multiple>
Example: <sentence demonstrating usage in {learning_language}>
Simple Explanation: <simplified definition in {learning_language}>
Level: <CEFR: A1|A2|B1|B2|C1|C2>
Synonyms: <exactly 3 synonyms in {learning_language}, comma-separated>
</format>

<edge_cases>
- If input is not a valid word: return Word: N/A, Translation: [Invalid input], other fields: N/A
- If word has no established CEFR level: return Level: N/A
- Always provide exactly 3 synonyms; use "N/A" if unavailable
</edge_cases>"""

REVERSE_PROMPT_TEMPLATE = """<persona>
You are a bidirectional translation engine. Function: convert native language input into structured learning language output with context.
</persona>

<context>
Learning Language: {learning_language}
Native Language: {native_language}
Input (Native): "{word}"
Direction: {native_language} → {learning_language}
</context>

<task>
Provide comprehensive translation options from {native_language} to {learning_language}. Include all common meanings with context for disambiguation.
</task>

<language_constraints>
- Translations field: {learning_language} ONLY
- Meanings field: {learning_language} ONLY
- Examples field: {learning_language} ONLY
- Context field: {native_language} ONLY (for user comprehension)
- NO other languages permitted
</language_constraints>

<format>
Return EXACTLY this structure (no markdown, no extra text, no commentary):

Word: <original input in {native_language}>
Translations: <{learning_language} translations; numbered list 1. 2. 3. for multiple meanings>
Meanings: <explanations in {learning_language}, numbered to match Translations>
Examples: <example sentences in {learning_language}, numbered to match Translations>
Context: <usage guidance in {native_language}, numbered to match Translations>
</format>

<edge_cases>
- If input cannot be translated: return all fields as "N/A - Cannot translate"
- If input has single meaning: return "1. [single translation]" format
- Max 5 numbered entries per field
</edge_cases>"""


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
