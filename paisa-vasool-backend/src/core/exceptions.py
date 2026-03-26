from __future__ import annotations


class AppError(Exception):
    """Base application error."""


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""


class ConflictError(AppError):
    """Raised on unique-constraint violations."""


class DatabaseError(AppError):
    """Raised when a database operation fails unexpectedly."""
