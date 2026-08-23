"""Tiny dependency-free metrics registry with Prometheus text exposition.

Counters + a latency histogram, enough for a real /metrics endpoint without
pulling a client library. In a multi-instance deployment each pod exposes its
own series and Prometheus scrapes them; aggregation happens at query time.
"""
from __future__ import annotations
import threading
import time
from collections import defaultdict

_LAT_BUCKETS = (0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)


class Metrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counters: dict[tuple[str, tuple], float] = defaultdict(float)
        self._hist_buckets: dict[tuple, list[int]] = defaultdict(lambda: [0] * (len(_LAT_BUCKETS) + 1))
        self._hist_sum: dict[tuple, float] = defaultdict(float)
        self._hist_count: dict[tuple, int] = defaultdict(int)
        self._started = time.time()

    def inc(self, name: str, labels: dict | None = None, value: float = 1.0) -> None:
        key = (name, tuple(sorted((labels or {}).items())))
        with self._lock:
            self._counters[key] += value

    def observe_latency(self, labels: dict, seconds: float) -> None:
        key = tuple(sorted(labels.items()))
        with self._lock:
            self._hist_sum[key] += seconds
            self._hist_count[key] += 1
            for i, b in enumerate(_LAT_BUCKETS):
                if seconds <= b:
                    self._hist_buckets[key][i] += 1
                    break
            else:
                self._hist_buckets[key][-1] += 1

    def render(self) -> str:
        lines = [
            "# HELP mcam_uptime_seconds Process uptime.",
            "# TYPE mcam_uptime_seconds gauge",
            f"mcam_uptime_seconds {time.time() - self._started:.1f}",
            "# HELP mcam_http_requests_total Total HTTP requests.",
            "# TYPE mcam_http_requests_total counter",
        ]
        with self._lock:
            for (name, labels), val in self._counters.items():
                lbl = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}{{{lbl}}} {val:g}")
            lines += ["# HELP mcam_http_request_duration_seconds Request latency.",
                      "# TYPE mcam_http_request_duration_seconds histogram"]
            for key, buckets in self._hist_buckets.items():
                lbl = ",".join(f'{k}="{v}"' for k, v in key)
                cumulative = 0
                for i, b in enumerate(_LAT_BUCKETS):
                    cumulative += buckets[i]
                    lines.append(f'mcam_http_request_duration_seconds_bucket{{{lbl},le="{b}"}} {cumulative}')
                cumulative += buckets[-1]
                lines.append(f'mcam_http_request_duration_seconds_bucket{{{lbl},le="+Inf"}} {cumulative}')
                lines.append(f"mcam_http_request_duration_seconds_sum{{{lbl}}} {self._hist_sum[key]:.4f}")
                lines.append(f"mcam_http_request_duration_seconds_count{{{lbl}}} {self._hist_count[key]}")
        return "\n".join(lines) + "\n"


metrics = Metrics()
