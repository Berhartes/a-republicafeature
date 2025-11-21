"""Shared rate limiter utilities for ETL API clients."""

from __future__ import annotations

import threading
import time
from typing import Optional

try:  # pragma: no cover - multiprocessing primitives may be unavailable in some environments
    from multiprocessing.sharedctypes import SynchronizedBase
    from multiprocessing.synchronize import Lock as MpLock
except ImportError:  # pragma: no cover - fallback for limited platforms
    SynchronizedBase = None  # type: ignore
    MpLock = None  # type: ignore

if MpLock is not None:  # type: ignore[truthy-bool]
    LockLike = Optional[MpLock]  # type: ignore[misc]
else:
    LockLike = Optional[threading.Lock]


class GlobalRateLimiter:
    """Global rate limiter shared between ETL workers.

    The limiter can operate with simple thread-based locking or, when
    provided with multiprocessing primitives, coordinate access across
    multiple processes.
    """

    def __init__(
        self,
        min_interval_seconds: float = 0.15,
        lock: LockLike = None,
        shared_last_request_time: Optional[SynchronizedBase] = None,
    ) -> None:
        self._lock = lock or threading.Lock()
        self._shared_last_request_time = shared_last_request_time
        self._last_request_time = 0.0
        self._min_interval = max(0.0, float(min_interval_seconds))

    @property
    def min_interval(self) -> float:
        """Return the minimum allowed interval between requests (seconds)."""
        return self._min_interval

    def set_min_interval(self, min_interval_seconds: float) -> None:
        """Adjust the minimum interval enforced by the limiter."""
        value = max(0.0, float(min_interval_seconds))
        with self._lock:
            self._min_interval = value

    def wait_if_needed(self) -> None:
        """Block until the next request is allowed under the rate limit."""
        with self._lock:
            now = time.perf_counter()
            last = self._get_last_request_time()
            elapsed = now - last

            if elapsed < self._min_interval:
                time.sleep(self._min_interval - elapsed)
                now = time.perf_counter()

            self._set_last_request_time(now)

    def _get_last_request_time(self) -> float:
        if self._shared_last_request_time is not None:
            return float(self._shared_last_request_time.value)
        return self._last_request_time

    def _set_last_request_time(self, value: float) -> None:
        if self._shared_last_request_time is not None:
            self._shared_last_request_time.value = float(value)
        else:
            self._last_request_time = float(value)


_global_rate_limiter = GlobalRateLimiter()


def configure_shared_rate_limiter(
    lock: LockLike,
    shared_last_request_time: Optional[SynchronizedBase],
    *,
    min_interval_seconds: Optional[float] = None,
) -> None:
    """Configure the global limiter to use shared multiprocessing primitives."""
    global _global_rate_limiter

    min_interval = (
        float(min_interval_seconds)
        if min_interval_seconds is not None
        else _global_rate_limiter.min_interval
    )

    if lock is None or shared_last_request_time is None:
        _global_rate_limiter = GlobalRateLimiter(min_interval_seconds=min_interval)
    else:
        _global_rate_limiter = GlobalRateLimiter(
            min_interval_seconds=min_interval,
            lock=lock,
            shared_last_request_time=shared_last_request_time,
        )


def get_rate_limiter() -> GlobalRateLimiter:
    """Return the current global rate limiter instance."""
    return _global_rate_limiter
