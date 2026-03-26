from __future__ import annotations

import asyncio
import logging
import os
import re
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MIGRATIONS_DIR = Path(__file__).parent / "src" / "api" / "migrations"
VERSION_PATTERN = re.compile(r"^V(\d+)__.*\.sql$")


def get_dsn() -> str:
    return (
        f"postgresql://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}"
        f"@{os.environ['DB_HOST']}:{os.environ['DB_PORT']}/{os.environ['DB_NAME']}"
    )


def get_migration_files() -> list[tuple[int, Path]]:
    """Return migration files sorted by version number."""
    migrations = []
    for f in MIGRATIONS_DIR.glob("*.sql"):
        match = VERSION_PATTERN.match(f.name)
        if match:
            version = int(match.group(1))
            migrations.append((version, f))
    return sorted(migrations, key=lambda x: x[0])


async def ensure_migrations_table(conn: asyncpg.Connection) -> None:
    """Create the schema_migrations tracking table if it doesn't exist."""
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version     INTEGER         PRIMARY KEY,
            filename    VARCHAR(255)    NOT NULL,
            applied_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
        )
    """)


async def get_applied_versions(conn: asyncpg.Connection) -> set[int]:
    """Return the set of already-applied migration versions."""
    rows = await conn.fetch("SELECT version FROM schema_migrations")
    return {row["version"] for row in rows}


async def apply_migration(
    conn: asyncpg.Connection, version: int, filepath: Path
) -> None:
    """Apply a single migration file inside a transaction."""
    sql = filepath.read_text(encoding="utf-8")
    async with conn.transaction():
        await conn.execute(sql)
        await conn.execute(
            "INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)",
            version,
            filepath.name,
        )
    logger.info("Applied: %s", filepath.name)


async def run_migrations() -> None:
    dsn = get_dsn()
    migration_files = get_migration_files()

    if not migration_files:
        logger.warning("No migration files found in %s", MIGRATIONS_DIR)
        return

    logger.info("Connecting to database...")
    conn: asyncpg.Connection = await asyncpg.connect(dsn)

    try:
        await ensure_migrations_table(conn)
        applied = await get_applied_versions(conn)

        pending = [(v, f) for v, f in migration_files if v not in applied]

        if not pending:
            logger.info("All migrations already applied. Nothing to do.")
            return

        logger.info("%d pending migration(s) found.", len(pending))

        for version, filepath in pending:
            await apply_migration(conn, version, filepath)

        logger.info("All migrations applied successfully.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migrations())