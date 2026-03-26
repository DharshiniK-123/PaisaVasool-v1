from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AUTH_SERVICE_URL: str
    MATCHING_SERVICE_URL: str
    HTTP_TIMEOUT: int

    class Config:
        env_file = ".env"


settings = Settings()
