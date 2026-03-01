import os
import uuid
import aiofiles
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

async def save_file_locally(file: UploadFile, document_type: str) -> tuple[str, str]:
    folder = os.path.join(UPLOAD_DIR, document_type)
    os.makedirs(folder, exist_ok=True)
    original_name = file.filename or "unknown"
    extension = original_name.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{extension}"
    storage_path = os.path.join(folder, unique_name)

    async with aiofiles.open(storage_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    return storage_path, extension