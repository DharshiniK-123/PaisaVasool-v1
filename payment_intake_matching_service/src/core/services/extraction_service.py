import pandas as pd
import pymupdf4llm
from fastapi import HTTPException


def extract_from_pdf(storage_path: str) -> str:
   
    try:
        text = pymupdf4llm.to_markdown(storage_path)
        if not text or not text.strip():
            raise HTTPException(status_code=422, detail="PDF appears to be empty or scanned. Only text-based PDFs are supported")
        return text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {str(e)}")


def extract_from_csv(storage_path: str) -> pd.DataFrame:
  
    try:
        df = pd.read_csv(storage_path)
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
        df = df.dropna(how="all")
        return df
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"CSV extraction failed: {str(e)}")


def extract_from_excel(storage_path: str) -> pd.DataFrame:
   
    try:
        df = pd.read_excel(storage_path, engine="openpyxl")
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
        df = df.dropna(how="all")
        return df
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Excel extraction failed: {str(e)}")


def extract_text(storage_path: str, file_type: str) -> str | pd.DataFrame:
    
    if file_type == "pdf":
        return extract_from_pdf(storage_path)
    elif file_type == "csv":
        return extract_from_csv(storage_path)
    elif file_type in ("xlsx", "xls"):
        return extract_from_excel(storage_path)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")