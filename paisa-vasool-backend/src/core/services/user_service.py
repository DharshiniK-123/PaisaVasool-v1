from datetime import datetime,timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.hashing import get_password_hashed
from src.utils.uuid import to_uuid
from src.data.models.postgres.refresh_token import RefreshToken
from src.data.repositories.generic_repository import commit_transaction, get_instance_by_any, insert_instance
from src.data.models.postgres.user import User
from src.data.repositories.generic_repository import update_instance_by_id, get_instance_by_id

async def create_user(db : AsyncSession,user_data, role: str = "finance_associate"):
    hashed_password = get_password_hashed(user_data.password)
    user_dict = user_data.model_dump()
    user_dict["password"] = hashed_password
    user_dict["role"] = role
    await insert_instance(db=db , model=User , **user_dict)
        

async def get_user(email : str , db : AsyncSession):
    user = await get_instance_by_any(db = db , model = User,data = {"email":email})
    return user

async def get_user_by_phone(phone_no : str , db : AsyncSession):
    user = await get_instance_by_any(db = db , model = User,data = {"phone_no":phone_no})
    return user

async def get_all_users(db: AsyncSession):
    result = await db.execute(
        select(User).where(User.role == "finance_associate").order_by(User.created_at.desc())
    )
    return result.scalars().all()

async def is_revoked(jti: str ,db : AsyncSession):
    jti=to_uuid(jti)
    refresh_token = await get_instance_by_any(model = RefreshToken , db = db , data={"token_id": jti})
    if not refresh_token:
        return True
    if refresh_token.expire_at < datetime.now(timezone.utc):
        refresh_token.is_revoked = True
        await commit_transaction(db=db)
        return True
    return refresh_token.is_revoked
    

async def insert_refresh_token(db : AsyncSession,jti : str):
    jti=to_uuid(jti)
    await insert_instance(model = RefreshToken , db=db , **{"token_id":jti})
    return True


async def revoke_refresh_token(jti: str, db):
    jti_uuid = to_uuid(jti)
    refresh_token = await get_instance_by_any(model=RefreshToken,db=db,data={"token_id": jti_uuid})
    if not refresh_token:
        return False
    refresh_token.is_revoked = True
    await commit_transaction(db=db)

    return True

async def toggle_user_status(user_id: int, db: AsyncSession) -> User | None:
    user = await get_instance_by_id(id=user_id, model=User, db=db)
    if not user:
        return None
    new_status = "inactive" if user.is_active == "active" else "active"
    await update_instance_by_id(id=user_id, model=User, db=db, is_active=new_status)
    user.is_active = new_status
    return user
