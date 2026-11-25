# LiveKit Cloud agent image (deploy from backend/: `lk agent create` / `lk agent deploy`).
FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app
COPY agent ./agent
# Bake VAD model weights into the image so cold starts don't download them.
RUN uv run --no-dev python -m agent.worker download-files
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser
CMD ["uv", "run", "--no-dev", "python", "-m", "agent.worker", "start"]
