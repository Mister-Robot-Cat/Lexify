import logging
from dataclasses import dataclass

from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger(__name__)

GRAMMAR_HELP_PROMPT = """You are a helpful, flexible language tutor. You can handle ANY kind of language question.

CRITICAL RULES:
1. ALWAYS reply in the SAME language as the user's question. If the user writes in Russian — answer in Russian. If in English — answer in English. If in Azerbaijani — answer in Azerbaijani. Match the user's language exactly.
2. If the user puts a sentence in quotes (e.g. "some sentence") or asks "can I say X?", "is this correct?", "как сказать X?" — treat it as a SENTENCE CHECK. Analyze whether the sentence is correct, explain errors if any, and suggest better alternatives.
3. Be flexible: the user may ask about grammar rules, check their sentences, ask how to express something, ask about differences between words, pronunciation, idioms, slang, formal vs informal, etc.
4. Keep examples in {learning_language} with translations to the user's question language when helpful.

User's native language: {native_language}
User's learning language: {learning_language}

User's message: "{question}"

Respond naturally in the SAME LANGUAGE as the user's message. Do NOT switch to English if the user wrote in Russian or Azerbaijani.

Format your response as plain text (no special format tags, no "Answer:", "Examples:" labels). Just write a clear, structured, helpful response with:
- Direct answer or sentence analysis
- Correct versions / alternatives if applicable  
- Examples
- Brief tips or notes if relevant

Keep it concise but thorough. Use emoji sparingly for clarity."""


@dataclass(frozen=True)
class GrammarHelp:
    """Structured result for grammar/language questions."""
    answer: str


class AskService:
    """Service for answering grammar and language questions using Groq AI."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        logger.info("AskService initialized with model: %s", self._model)

    async def ask_question(
        self,
        question: str,
        native_language: str = "Russian",
        learning_language: str = "English"
    ) -> GrammarHelp:
        """Answer a grammar or language question.

        Args:
            question: The user's question about grammar, vocabulary, etc.
            native_language: User's native language
            learning_language: Language user is learning

        Returns:
            GrammarHelp with the AI's answer.

        Raises:
            ValueError: If the response cannot be parsed.
        """
        if len(question.strip()) < 3:
            raise ValueError("Question too short")
            
        if len(question.strip()) > 1000:
            raise ValueError("Question too long (maximum 1000 characters)")

        prompt = GRAMMAR_HELP_PROMPT.format(
            question=question,
            native_language=native_language,
            learning_language=learning_language,
        )
        logger.debug("Sending grammar question to Groq: %s", question[:80])

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1024,
            )
            raw_text = response.choices[0].message.content.strip()
            logger.debug("Grammar help response length: %d", len(raw_text))
            
            if not raw_text:
                raise ValueError("Empty response from grammar help API")

            return GrammarHelp(answer=raw_text)
        except Exception as e:
            logger.exception("Grammar help API call failed: %s", str(e))
            raise ValueError(f"Failed to answer question: {str(e)}")


# Module-level singleton
ask_service = AskService()
