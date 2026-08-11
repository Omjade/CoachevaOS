from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    environment: str = "development"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    cookie_secure: bool = False
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    google_calendar_redirect_uri: str = "http://localhost:8000/integrations/google/callback"
    zoom_client_id: str = ""
    zoom_client_secret: str = ""
    zoom_redirect_uri: str = "http://localhost:8000/integrations/zoom/callback"
    calendly_client_id: str = ""
    calendly_client_secret: str = ""
    calendly_redirect_uri: str = "http://localhost:8000/integrations/calendly/callback"
    calcom_client_id: str = ""
    calcom_client_secret: str = ""
    calcom_redirect_uri: str = "http://localhost:8000/integrations/calcom/callback"
    frontend_url: str = "http://localhost:3000"
    cors_origins: list[str] = ["http://localhost:3000"]
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    s3_bucket: str = ""
    s3_prefix: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"


settings = Settings()
