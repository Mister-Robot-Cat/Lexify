import logging

from groq import AsyncGroq
from pydantic import BaseModel, Field, ValidationError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """<persona>
You are a conversational language tutor. Mission: assist students with {learning_language} learning through natural dialogue. Maintain warm, encouraging tone.
</persona>

<context>
Learning Language: {learning_language}
Student Native Language: {native_language}
</context>

<response_language_rule>
MANDATORY: Detect the language of the user's message. Respond in that EXACT language.
- User writes Russian → Respond in Russian
- User writes English → Respond in English  
- User writes Azerbaijani → Respond in Azerbaijani
- NEVER switch languages mid-conversation unless explicitly requested
</response_language_rule>

<conversation_guidelines>
1. CONTEXTUAL MEMORY: Reference prior discussion. If user asks "and what about X?" — connect to previous topic.
2. SCOPE: Handle grammar, vocabulary, sentence correction, pronunciation, idioms, slang, register (formal/informal), writing tips, exam preparation.
3. SENTENCE CORRECTION: When user provides text for checking → analyze errors → provide corrected version → explain each correction.
4. YES/NO QUESTIONS: For "can I say X?" or "is X correct?" → Start with direct Yes/No → follow with explanation.
5. EXAMPLES: Include {learning_language} examples with {native_language} translations when pedagogically useful.
6. BREVITY: Keep responses concise (2-4 sentences) but substantive. Avoid filler.
</conversation_guidelines>

<edge_cases>
- Empty/invalid input: "Please send a message I can help with."
- Non-language content: "I can help with language learning. Please ask about {learning_language}."
- Offensive content: "I cannot assist with that. Let's focus on language learning."
- Unclear request: Ask clarifying question in user's detected language.
</edge_cases>"""


class ChatResponse(BaseModel):
    """Validated chat response from the AI tutor."""

    content: str = Field(
        min_length=1,
        max_length=4000,
        description="The chat response content"
    )


class AskService:
    """Chatbot service for grammar and language questions using Groq AI."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        logger.info("AskService (chatbot) initialized with model: %s", self._model)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,
    )
    async def chat(
        self,
        user_message: str,
        chat_history: list[dict[str, str]],
        native_language: str = "Russian",
        learning_language: str = "English",
    ) -> ChatResponse:
        """Send a message in the context of a conversation.

        Args:
            user_message: The user's new message.
            chat_history: List of previous messages [{"role": "user"|"assistant", "content": str}].
            native_language: User's native language.
            learning_language: Language user is learning.

        Returns:
            ChatResponse with validated content.

        Raises:
            ValueError: On API errors, empty responses, or validation failures.
        """
        if len(user_message.strip()) < 2:
            raise ValueError("Message too short")

        system = SYSTEM_PROMPT.format(
            native_language=native_language,
            learning_language=learning_language,
        )

        # Build messages: system + history + new user message
        messages = [{"role": "system", "content": system}]
        messages.extend(chat_history)
        messages.append({"role": "user", "content": user_message})

        logger.debug("Grammar chat: %d history msgs, new: %s", len(chat_history), user_message[:80])

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.7,
                max_tokens=1024,
            )
            raw_reply = response.choices[0].message.content.strip()
            logger.debug("Grammar chat raw reply length: %d", len(raw_reply))

            # Validate response with Pydantic
            validated = ChatResponse.model_validate({"content": raw_reply})
            return validated

        except ValidationError as e:
            logger.error("Chat response validation failed: %s", e)
            raise ValueError(f"Invalid response format: {e}") from e
        except Exception as e:
            logger.exception("Grammar chatbot API call failed: %s", str(e))
            raise ValueError(f"Failed to get response: {str(e)}") from e


# Module-level singleton
ask_service = AskService()
