"""Small in-memory sliding-window limiter. Single-process only; use Redis when scaling out."""
import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    def __init__(self, limit: int, window: float = 60.0) -> None:
        self.limit, self.window = limit, window
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> float:
        """Record a hit. Returns 0 if allowed, else seconds until the next slot."""
        now = time.monotonic() if now is None else now
        q = self._hits[key]
        while q and now - q[0] >= self.window:
            q.popleft()
        if len(q) >= self.limit:
            return max(1.0, self.window - (now - q[0]))
        q.append(now)
        if not q:  # pragma: no cover
            self._hits.pop(key, None)
        return 0.0
