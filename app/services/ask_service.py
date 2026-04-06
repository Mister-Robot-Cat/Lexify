import logging
from dataclasses import dataclass

from groq import AsyncGroq

from app.config import settings

logger = logging.getLogger(__name__)

GRAMMAR_HELP_PROMPT = """You are a helpful language teacher and grammar expert. The user is asking a question about grammar, vocabulary, or language learning.

User's question: "{question}"
User's native language: {native_language}
User's learning language: {learning_language}

Provide a clear, helpful, and encouraging answer. Focus on:
1. Direct answer to their question
2. Simple explanation with examples
3. Practical tips for remembering/using this concept
4. Common mistakes to avoid

Keep the answer conversational and easy to understand. Use examples in both their native and learning languages when helpful.

Return STRICTLY in this format:

Answer: <your detailed answer>
Examples: <practical examples showing the concept>
Tips: <learning tips and memory aids>
Common_Mistakes: <common errors to watch out for>"""

@dataclass(frozen=True)
class GrammarHelp:
    """Structured result for grammar/language questions."""
    answer: str
    examples: str
    tips: str
    common_mistakes: str

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
            GrammarHelp with detailed answer and examples.

        Raises:
            ValueError: If the response cannot be parsed.
            Exception: On API communication errors.
        """
        if len(question.strip()) < 5:
            raise ValueError("Question too short (minimum 5 characters)")
            
        if len(question.strip()) > 500:
            raise ValueError("Question too long (maximum 500 characters)")

        prompt = GRAMMAR_HELP_PROMPT.format(
            question=question,
            native_language=native_language,
            learning_language=learning_language,
        )
        logger.debug("Sending grammar question to Groq: %s", question[:50])

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,  # Slightly higher for more creative explanations
                max_tokens=800,
            )
            raw_text = response.choices[0].message.content.strip()
            logger.debug("Grammar help raw response length: %d", len(raw_text))
            
            if not raw_text:
                raise ValueError("Empty response from grammar help API")
                
            return self._parse_response(raw_text, question)
        except Exception as e:
            logger.exception("Grammar help API call failed: %s", str(e))
            raise ValueError(f"Failed to answer question: {str(e)}")

    @staticmethod
    def _parse_response(text: str, original_question: str) -> GrammarHelp:
        """Parse the grammar help response from Groq."""
        import re
        
        def extract_section(section_name: str) -> str:
            """Extract a section from the response."""
            pattern = rf"{section_name}:\s*(.*?)(?=\n\s*(?:Answer|Examples|Tips|Common_Mistakes):|\Z)"
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                content = match.group(1).strip()
                # Clean up formatting
                content = re.sub(r'\n+', ' ', content)  # Replace newlines with spaces
                content = re.sub(r'\s+', ' ', content)  # Normalize whitespace
                return content
            return "Not specified"

        # Extract all sections
        answer = extract_section("Answer")
        examples = extract_section("Examples")
        tips = extract_section("Tips")
        common_mistakes = extract_section("Common_Mistakes")

        # Validate essential sections
        if not answer or answer == "Not specified":
            logger.warning("Grammar help missing Answer section for question: %s", original_question)
            raise ValueError("Could not parse grammar help response - missing Answer section")

        return GrammarHelp(
            answer=answer,
            examples=examples,
            tips=tips,
            common_mistakes=common_mistakes
        )

# Module-level singleton
ask_service = AskService()
