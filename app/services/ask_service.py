import logging

from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a friendly, knowledgeable language tutor chatbot. You help students learn {learning_language}. The student's native language is {native_language}.

RULES:
1. ALWAYS reply in the SAME language the user writes in. If they write Russian — answer in Russian. English — English. Azerbaijani — Azerbaijani. NEVER switch languages unless asked.
2. You are a CONVERSATIONAL chatbot. Remember context from earlier messages. If the user says "and what about X?" — relate it to what you discussed before.
3. You handle ANY language question: grammar, vocabulary, sentence checking, pronunciation, idioms, slang, formal/informal, writing tips, exam prep, etc.
4. If the user sends a sentence (in quotes or not) and asks to check it — analyze it, point out errors, suggest corrections, and explain why.
5. If the user asks "can I say X?" or "is X correct?" — give a direct yes/no first, then explain.
6. Keep answers concise but helpful. Use examples in {learning_language} with translations when useful.
7. Be encouraging and conversational, like a real tutor chatting with a student."""


class AskService:
    """Chatbot service for grammar and language questions using Groq AI."""

    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        logger.info("AskService (chatbot) initialized with model: %s", self._model)

    async def chat(
        self,
        user_message: str,
        chat_history: list[dict[str, str]],
        native_language: str = "Russian",
        learning_language: str = "English",
    ) -> str:
        """Send a message in the context of a conversation.

        Args:
            user_message: The user's new message.
            chat_history: List of previous messages [{"role": "user"|"assistant", "content": str}].
            native_language: User's native language.
            learning_language: Language user is learning.

        Returns:
            The assistant's reply as a string.

        Raises:
            ValueError: On API errors or empty responses.
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
            reply = response.choices[0].message.content.strip()
            logger.debug("Grammar chat reply length: %d", len(reply))

            if not reply:
                raise ValueError("Empty response from chatbot API")

            return reply
        except Exception as e:
            logger.exception("Grammar chatbot API call failed: %s", str(e))
            raise ValueError(f"Failed to get response: {str(e)}")


# Module-level singleton
ask_service = AskService()
