from __future__ import annotations

from uuid import UUID


def to_uuid(value: str) -> UUID:
    try:
        return UUID(value)
    except (ValueError, TypeError) as exc:
        raise ValueError("Invalid UUID format") from exc
