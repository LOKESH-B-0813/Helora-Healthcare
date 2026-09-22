"""In-memory sliding-window rate limiter for Medi-AI.

Single-process protection. In production with multiple workers this should be
backed by a shared store (e.g. Redis); the interface is kept simple so it can
be swapped out.
"""
import threading
import time

from .errors import RateLimitedError


class SlidingWindowLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        # key -> list of event timestamps
        self._events = {}
        # prune keeps memory bounded
        self._prune_every = 1000
        self._hits = 0
        self._max_keys = 50000

    def _prune(self, window_seconds: int, now: float):
        stale = []
        for key in self._events:
            bucket = self._events[key]
            cutoff = now - window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.pop(0)
            if not bucket:
                stale.append(key)
        for key in stale:
            del self._events[key]
        if len(self._events) > self._max_keys:
            # Evict oldest keys to bound memory.
            for key in list(self._events)[: len(self._events) - self._max_keys]:
                del self._events[key]

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            self._hits += 1
            if self._hits % self._prune_every == 0:
                self._prune(window_seconds, now)
            bucket = self._events.setdefault(key, [])
            cutoff = now - window_seconds
            while bucket and bucket[0] <= cutoff:
                bucket.pop(0)
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True

    def check(self, key: str, limit: int, window_seconds: int):
        if not self.allow(key, limit, window_seconds):
            raise RateLimitedError()


# Module-level shared instance.
limiter = SlidingWindowLimiter()


def check_rate_limit(scope: str, key: str, limit: int, window_seconds: int):
    limiter.check(f'{scope}:{key}', limit, window_seconds)