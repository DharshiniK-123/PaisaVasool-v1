
from uuid import UUID
def to_uuid(value:str)->UUID:
    try:
        return UUID(value)
    except (ValueError, TypeError):
        raise ValueError("Invalid UUID format")