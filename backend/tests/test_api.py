import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.ratelimit import SlidingWindowLimiter

SETTINGS = Settings(
    livekit_url="wss://test.livekit.cloud", livekit_api_key="APItestkey", livekit_api_secret="s" * 40,
    rate_limit_per_minute=3, _env_file=None,
)


@pytest.fixture
def client():
    return TestClient(create_app(SETTINGS))


def test_token_is_scoped_and_short_lived(client):
    r = client.post("/api/token", json={})
    assert r.status_code == 200
    body = r.json()
    claims = jwt.decode(body["token"], SETTINGS.livekit_api_secret, algorithms=["HS256"])
    assert claims["video"]["room"] == body["room"] and claims["video"]["roomJoin"] is True
    assert claims["video"]["canPublishSources"] == ["microphone"]
    assert 0 < claims["exp"] - claims["nbf"] <= SETTINGS.token_ttl_seconds
    assert "livekit_api_secret" not in r.text and SETTINGS.livekit_api_secret not in r.text
    assert r.headers["cache-control"] == "no-store"


def test_each_call_gets_its_own_room(client):
    a, b = client.post("/api/token").json(), client.post("/api/token").json()
    assert a["room"] != b["room"] and a["identity"] != b["identity"]


def test_rate_limit(client):
    codes = [client.post("/api/token").status_code for _ in range(5)]
    assert codes == [200, 200, 200, 429, 429]
    assert int(client.post("/api/token").headers["retry-after"]) >= 1


def test_limiter_window_expires():
    lim = SlidingWindowLimiter(1, 10)
    assert lim.check("k", 0) == 0 and lim.check("k", 5) > 0 and lim.check("k", 11) == 0


def test_cors_blocks_unknown_origin(client):
    r = client.options("/api/token", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
    assert "access-control-allow-origin" not in r.headers


def test_persona_in_dispatch():
    import json
    s = SETTINGS.model_copy(update={"agent_persona": "haven"})
    claims = jwt.decode(TestClient(create_app(s)).post("/api/token").json()["token"], s.livekit_api_secret, algorithms=["HS256"])
    agents = claims["roomConfig"]["agents"]
    assert agents[0]["agentName"] == s.agent_name
    assert json.loads(agents[0]["metadata"]) == {"persona": "haven"}
