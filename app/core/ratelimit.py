import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status


class FailureLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self.hits: dict[str, deque] = defaultdict(deque)

    def _prune(self, key: str, now: float) -> deque:
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if not q:
            self.hits.pop(key, None)
            return deque()
        return q

    def check(self, key: str) -> None:
        now = time.monotonic()
        q = self._prune(key, now)
        if len(q) >= self.limit:
            retry = int(self.window - (now - q[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again in a few minutes.",
                headers={"Retry-After": str(retry)},
            )

    def record(self, key: str) -> None:
        self.hits[key].append(time.monotonic())

    def reset(self, key: str) -> None:
        self.hits.pop(key, None)

    def clear(self) -> None:
        self.hits.clear()


login_by_account = FailureLimiter(limit=5, window_seconds=900)
login_by_ip = FailureLimiter(limit=30, window_seconds=900)
register_by_ip = FailureLimiter(limit=10, window_seconds=3600)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"
