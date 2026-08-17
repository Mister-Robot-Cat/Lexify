"""Lightweight, idempotent schema reconciliation.

``Base.metadata.create_all`` creates missing *tables* but never alters existing
ones. The web platform adds columns to the pre-existing ``users`` table, so this
module brings older databases up to date without introducing a full Alembic
migration chain.

Every statement is guarded by an ``information_schema`` lookup, so running this
on an already-migrated database is a no-op.
"""

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

logger = logging.getLogger(__name__)

# (table, column, DDL fragment used when the column is missing)
_REQUIRED_COLUMNS: list[tuple[str, str, str]] = [
    ("users", "email", "VARCHAR(255) NULL"),
    ("users", "password_hash", "VARCHAR(255) NULL"),
    ("users", "display_name", "VARCHAR(80) NULL"),
    ("users", "daily_goal", "INT NOT NULL DEFAULT 10"),
    ("users", "streak_days", "INT NOT NULL DEFAULT 0"),
    ("users", "last_active_day", "DATE NULL"),
]

# (table, index name, DDL fragment)
_REQUIRED_INDEXES: list[tuple[str, str, str]] = [
    ("users", "uq_users_email", "UNIQUE (email)"),
]


async def _column_exists(conn: AsyncConnection, table: str, column: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    )
    return bool(result.scalar())


async def _index_exists(conn: AsyncConnection, table: str, index: str) -> bool:
    result = await conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.statistics "
            "WHERE table_schema = DATABASE() AND table_name = :t AND index_name = :i"
        ),
        {"t": table, "i": index},
    )
    return bool(result.scalar())


async def _telegram_id_is_nullable(conn: AsyncConnection) -> bool:
    result = await conn.execute(
        text(
            "SELECT is_nullable FROM information_schema.columns "
            "WHERE table_schema = DATABASE() AND table_name = 'users' "
            "AND column_name = 'telegram_id'"
        )
    )
    value = result.scalar()
    return value is None or str(value).upper() == "YES"


async def sync_schema(conn: AsyncConnection) -> None:
    """Add any columns/indexes the ORM expects but the live database lacks."""
    for table, column, ddl in _REQUIRED_COLUMNS:
        if await _column_exists(conn, table, column):
            continue
        await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
        logger.info("Schema sync: added %s.%s", table, column)

    # Web-only accounts have no Telegram ID, so the column must accept NULL.
    if not await _telegram_id_is_nullable(conn):
        await conn.execute(text("ALTER TABLE users MODIFY telegram_id BIGINT NULL"))
        logger.info("Schema sync: users.telegram_id is now nullable")

    for table, index, ddl in _REQUIRED_INDEXES:
        if await _index_exists(conn, table, index):
            continue
        await conn.execute(text(f"ALTER TABLE {table} ADD CONSTRAINT {index} {ddl}"))
        logger.info("Schema sync: added index %s on %s", index, table)
