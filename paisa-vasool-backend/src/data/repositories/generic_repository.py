from __future__ import annotations

import logging
from typing import Any, cast

from sqlalchemy import delete, insert, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.clients.postgres_client import base
from src.core.exceptions import DatabaseError, NotFoundError

logger = logging.getLogger(__name__)


async def commit_transaction(db: AsyncSession) -> None:
    try:
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Database commit failed") from e


async def insert_instance[T: base](model: type[T], db: AsyncSession, **kwargs: Any) -> None:
    try:
        stmt = insert(model).values(**kwargs)
        await db.execute(stmt)
        await commit_transaction(db=db)
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Insert failed") from e


async def bulk_insert_instance[T: base](
    model: type[T], db: AsyncSession, data: list[dict[str, Any]]
) -> None:
    try:
        stmt = insert(model)
        await db.execute(stmt, data)
        await commit_transaction(db=db)
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Bulk insert failed") from e


async def update_instance_by_id[T: base](
    id: int, model: type[T], db: AsyncSession, **kwargs: Any
) -> None:
    try:
        stmt = update(model).where(cast(Any, model).id == id).values(**kwargs)
        results = await db.execute(stmt)
        if cast(Any, results).rowcount == 0:
            raise NotFoundError("Record not found")
        await commit_transaction(db=db)
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Update failed") from e


async def bulk_update_instance[T: base](
    model: type[T], db: AsyncSession, filter: dict[str, Any], data: dict[str, Any]
) -> None:
    try:
        stmt = update(model)
        for key, value in filter.items():
            stmt = stmt.where(getattr(model, key) == value)
        stmt = stmt.values(**data)
        results = await db.execute(stmt)
        if cast(Any, results).rowcount == 0:
            raise NotFoundError("Records not found")
        await commit_transaction(db=db)
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Bulk update failed") from e


async def delete_instance_by_id[T: base](id: int, model: type[T], db: AsyncSession) -> None:
    try:
        stmt = delete(model).where(cast(Any, model).id == id)
        results = await db.execute(stmt)
        if cast(Any, results).rowcount == 0:
            raise NotFoundError("Record not found")
        await commit_transaction(db=db)
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Delete failed") from e


async def bulk_delete_instance[T: base](model: type[T], db: AsyncSession, ids: list[int]) -> None:
    try:
        stmt = delete(model).where(cast(Any, model).id.in_(ids))
        results = await db.execute(stmt)
        if cast(Any, results).rowcount == 0:
            raise NotFoundError("Record not found")
        await commit_transaction(db=db)
    except SQLAlchemyError as e:
        await db.rollback()
        raise DatabaseError("Bulk delete failed") from e


async def get_instance_by_id[T: base](id: int, model: type[T], db: AsyncSession) -> T | None:
    try:
        stmt = select(model).where(cast(Any, model).id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        raise DatabaseError("Get by ID failed") from e


async def get_instance_by_any[T: base](
    model: type[T], db: AsyncSession, data: dict[str, Any]
) -> T | None:
    try:
        conditions = []
        for key, value in data.items():
            conditions.append(getattr(model, key) == value)
        stmt = select(model).where(*conditions)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        raise DatabaseError("Get by any failed") from e


async def bulk_get_instance[T: base](model: type[T], db: AsyncSession, **kwargs: Any) -> list[T]:
    try:
        stmt = select(model)
        for key, value in kwargs.items():
            stmt = stmt.where(getattr(model, key) == value)
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except SQLAlchemyError as e:
        raise DatabaseError("Bulk get failed") from e
