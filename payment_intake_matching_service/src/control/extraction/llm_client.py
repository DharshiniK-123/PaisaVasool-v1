from langchain_groq import ChatGroq
from src.config.settings import settings

def get_llm() -> ChatGroq:
    return ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=settings.GROQ_API_KEY,
        temperature=0,
    )