"""Server-side settings. All secrets come from the environment (see ../.env.example)."""
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    livekit_url: str = Field(..., description="wss://<project>.livekit.cloud")
    livekit_api_key: str
    livekit_api_secret: str

    agent_name: str = "estate-agent"
    agent_persona: str = ""  # sent to the shared agent as dispatch metadata, e.g. "haven"
    token_ttl_seconds: int = 600  # token must be used to connect within 10 minutes
    allowed_origins: str = "http://localhost:5299,http://127.0.0.1:5299"

    # Abuse protection (per client IP, sliding window) and a global ceiling for free-tier safety.
    rate_limit_per_minute: int = 5
    global_rate_limit_per_minute: int = 60
    trust_proxy_headers: bool = False  # only enable behind a proxy you control

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
