"""Redis-based caching service for LLM responses and expensive operations."""

import json
import logging
from typing import Any

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Async Redis cache wrapper with JSON serialization."""

    def __init__(self) -> None:
        self._redis: redis.Redis | None = None
        self._ttl = settings.cache_ttl_seconds

    async def _get_client(self) -> redis.Redis:
        """Lazy initialization of Redis connection."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30,
                )
                await self._redis.ping()
                logger.info("Redis cache connected successfully")
            except Exception as e:
                logger.warning("Failed to connect to Redis: %s. Caching disabled.", e)
                raise
        return self._redis

    def _make_key(self, prefix: str, *parts: str) -> str:
        """Create a cache key from prefix and parts."""
        safe_parts = [p.replace(":", "_").lower() for p in parts]
        return f"lexify:{prefix}:{':'.join(safe_parts)}"

    async def get(self, prefix: str, *key_parts: str) -> Any | None:
        """Get value from cache.

        Args:
            prefix: Cache key prefix (e.g., 'word', 'ielts')
            key_parts: Variable parts of the key

        Returns:
            Deserialized value or None if not found/error
        """
        try:
            client = await self._get_client()
            key = self._make_key(prefix, *key_parts)
            data = await client.get(key)

            if data is None:
                return None

            value = json.loads(data)
            logger.debug("Cache HIT for key: %s", key)
            return value

        except Exception as e:
            logger.warning("Cache GET failed for %s: %s", prefix, e)
            return None

    async def set(
        self,
        prefix: str,
        *key_parts: str,
        value: Any,
        ttl: int | None = None
    ) -> bool:
        """Set value in cache.

        Args:
            prefix: Cache key prefix
            key_parts: Variable parts of the key
            value: Value to cache (must be JSON serializable)
            ttl: Optional custom TTL (seconds), defaults to config

        Returns:
            True if successful, False otherwise
        """
        try:
            client = await self._get_client()
            key = self._make_key(prefix, *key_parts)
            data = json.dumps(value, default=str)
            effective_ttl = ttl or self._ttl

            await client.setex(key, effective_ttl, data)
            logger.debug("Cache SET for key: %s (TTL=%ds)", key, effective_ttl)
            return True

        except Exception as e:
            logger.warning("Cache SET failed for %s: %s", prefix, e)
            return False

    async def delete(self, prefix: str, *key_parts: str) -> bool:
        """Delete value from cache.

        Returns:
            True if key was deleted, False otherwise
        """
        try:
            client = await self._get_client()
            key = self._make_key(prefix, *key_parts)
            result = await client.delete(key)
            logger.debug("Cache DELETE for key: %s (deleted=%d)", key, result)
            return result > 0

        except Exception as e:
            logger.warning("Cache DELETE failed for %s: %s", prefix, e)
            return False

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis is not None:
            await self._redis.close()
            self._redis = None
            logger.info("Redis cache connection closed")


# Module-level singleton
cache_service = CacheService()
