import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import User, UserWord, Word
from app.database.session import async_session_factory
from app.services.gemini_service import WordExplanation, ReverseTranslation, groq_service

logger = logging.getLogger(__name__)


class WordService:
    """Service for managing words and user vocabularies."""

    async def get_or_create_user(self, session: AsyncSession, telegram_id: int) -> User:
        """Fetch an existing user or create a new one by telegram_id."""
        stmt = select(User).where(User.telegram_id == telegram_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user is None:
            user = User(telegram_id=telegram_id)
            session.add(user)
            await session.flush()
            logger.info("Created new user: telegram_id=%d, id=%d", telegram_id, user.id)

        return user

    async def find_word(self, session: AsyncSession, text: str, language: str = "Russian") -> Word | None:
        """Look up a word in the dictionary by text and language (case-insensitive)."""
        stmt = select(Word).where(Word.word.ilike(text.strip()), Word.language == language)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_word(self, session: AsyncSession, explanation: WordExplanation, language: str = "Russian") -> Word:
        """Persist a new Word record from a Gemini explanation."""
        word = Word(
            word=explanation.word.lower(),
            language=language,
            translation=explanation.translation,
            meaning=explanation.meaning,
            example=explanation.example,
            simple_explanation=explanation.simple_explanation,
            level=explanation.level,
            synonyms=explanation.synonyms,
        )
        session.add(word)
        await session.flush()
        logger.info("Created word: id=%d, word='%s'", word.id, word.word)
        return word

    async def link_word_to_user(
        self, session: AsyncSession, user: User, word: Word
    ) -> tuple[UserWord, bool]:
        """Link a word to a user's vocabulary.

        Returns:
            Tuple of (UserWord, created) where created is True if the link is new.
        """
        stmt = select(UserWord).where(
            UserWord.user_id == user.id,
            UserWord.word_id == word.id,
        )
        result = await session.execute(stmt)
        user_word = result.scalar_one_or_none()

        if user_word is not None:
            return user_word, False

        user_word = UserWord(user_id=user.id, word_id=word.id)
        session.add(user_word)
        await session.flush()
        logger.info("Linked word_id=%d to user_id=%d", word.id, user.id)
        return user_word, True

    async def process_word(
        self, session: AsyncSession, telegram_id: int, text: str
    ) -> tuple[Word | ReverseTranslation, bool]:
        """Process a word/phrase: look up existing, or fetch from AI and create."""
        if not text or len(text.strip()) == 0:
            raise ValueError("Empty text provided")
            
        if len(text.strip()) > 500:
            raise ValueError("Text too long (maximum 500 characters)")
            
        user = await self.get_or_create_user(session, telegram_id)
        
        # Detect if input is in native or learning language
        lang_type = self._detect_language(text, user.language, user.learning_language)
        
        if lang_type == "native":
            # User wrote in native language - provide reverse translation options
            try:
                reverse_result = await groq_service.reverse_translate(
                    text,
                    language=user.language,
                    learning_language=user.learning_language,
                )
                return reverse_result, False  # Not creating a word entry for reverse translations
            except Exception as e:
                logger.warning("Reverse translation failed for user %d: %s", telegram_id, str(e))
                raise ValueError(f"Translation failed: {str(e)}")
        else:
            # User wrote in learning language - normal flow
            try:
                word = await self.find_word(session, text, language=user.language)
                if word is None:
                    explanation = await groq_service.explain_word(
                        text,
                        language=user.language,
                        learning_language=user.learning_language,
                    )
                    word = await self.create_word(session, explanation, language=user.language)
                _, created = await self.link_word_to_user(session, user, word)
                return word, created
            except Exception as e:
                logger.warning("Word processing failed for user %d: %s", telegram_id, str(e))
                raise ValueError(f"Word processing failed: {str(e)}")

    async def set_user_language(
        self, session: AsyncSession, telegram_id: int, language: str
    ) -> User:
        """Update the user's preferred translation language."""
        user = await self.get_or_create_user(session, telegram_id)
        user.language = language
        await session.flush()
        logger.info("User %d set language to '%s'", telegram_id, language)
        return user

    async def get_user_language(
        self, session: AsyncSession, telegram_id: int
    ) -> str:
        """Get the user's preferred translation language."""
        user = await self.get_or_create_user(session, telegram_id)
        return user.language

    async def delete_user_word(
        self, session: AsyncSession, telegram_id: int, word_text: str
    ) -> bool:
        """Remove a word from the user's vocabulary. Returns True if deleted."""
        user = await self.get_or_create_user(session, telegram_id)

        stmt = (
            select(UserWord)
            .join(Word)
            .where(UserWord.user_id == user.id, Word.word.ilike(word_text.strip()))
        )
        result = await session.execute(stmt)
        user_word = result.scalar_one_or_none()

        if user_word is None:
            return False

        await session.delete(user_word)
        await session.flush()
        logger.info("Deleted word '%s' from user %d", word_text, telegram_id)
        return True

    async def set_ui_language(
        self, session: AsyncSession, telegram_id: int, ui_lang: str
    ) -> User:
        """Update the user's UI language."""
        user = await self.get_or_create_user(session, telegram_id)
        user.ui_language = ui_lang
        await session.flush()
        logger.info("User %d set ui_language to '%s'", telegram_id, ui_lang)
        return user

    async def get_ui_language(
        self, session: AsyncSession, telegram_id: int
    ) -> str:
        """Get the user's UI language code."""
        user = await self.get_or_create_user(session, telegram_id)
        return user.ui_language

    async def set_learning_language(
        self, session: AsyncSession, telegram_id: int, lang: str
    ) -> User:
        """Update the language the user is learning."""
        user = await self.get_or_create_user(session, telegram_id)
        user.learning_language = lang
        await session.flush()
        logger.info("User %d set learning_language to '%s'", telegram_id, lang)
        return user

    async def get_learning_language(
        self, session: AsyncSession, telegram_id: int
    ) -> str:
        """Get the language the user is learning."""
        user = await self.get_or_create_user(session, telegram_id)
        return user.learning_language

    async def get_user_word_count(self, session: AsyncSession, user: User) -> int:
        """Return total number of words in user's vocabulary."""
        stmt = select(UserWord).where(UserWord.user_id == user.id)
        result = await session.execute(stmt)
        return len(result.scalars().all())

    def _detect_language(self, text: str, user_language: str, learning_language: str) -> str:
        """Simple language detection based on characters and user preferences.
        
        Returns 'native' if text appears to be in user's native language,
        'learning' if it appears to be in learning language.
        """
        # Simple heuristic: check for Cyrillic characters (Russian) vs Latin
        has_cyrillic = any('\u0400' <= c <= '\u04FF' for c in text)
        has_latin = any('a' <= c.lower() <= 'z' for c in text)
        
        # If text has Cyrillic and user's native is Russian, assume native language
        if has_cyrillic and user_language == "Russian":
            return "native"
        # If text has only Latin and learning language is English, assume learning language
        elif has_latin and not has_cyrillic and learning_language == "English":
            return "learning"
        # Default: assume learning language for mixed/unclear cases
        else:
            return "learning"


word_service = WordService()
