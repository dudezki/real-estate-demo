import logging

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .ratelimit import SlidingWindowLimiter
from .tokens import issue_token

log = logging.getLogger("haven.api")


def create_app(settings: Settings | None = None) -> FastAPI:
    s = settings or get_settings()
    app = FastAPI(title="HAVEN. API", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(
        CORSMiddleware, allow_origins=s.origins, allow_methods=["POST", "GET"], allow_headers=["Content-Type"],
    )
    per_ip = SlidingWindowLimiter(s.rate_limit_per_minute)
    overall = SlidingWindowLimiter(s.global_rate_limit_per_minute)

    def client_ip(req: Request) -> str:
        if s.trust_proxy_headers and (fwd := req.headers.get("x-forwarded-for")):
            return fwd.split(",")[0].strip()
        return req.client.host if req.client else "unknown"

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers["Cache-Control"] = "no-store"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        return resp

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    @app.post("/api/token")
    async def token(request: Request, response: Response):
        wait = per_ip.check(client_ip(request)) or overall.check("*")
        if wait:
            raise HTTPException(429, "Too many call attempts. Please try again shortly.", headers={"Retry-After": str(int(wait))})
        payload = issue_token(s)
        log.info("issued token room=%s", payload["room"])  # never log the token itself
        return payload

    return app
