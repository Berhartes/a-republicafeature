"""Utilities to persist ETL run manifests and structured logs."""

from __future__ import annotations

import json
import hashlib
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class EtlRunArtifact(BaseModel):
    path: str
    size_bytes: int
    sha256: str


class EtlRunStats(BaseModel):
    total_legisladores: int
    total_fornecedores: int
    total_despesas: float
    deputados_processados: int
    deputados_solicitados: int
    duration_seconds: float


class EtlRunEntry(BaseModel):
    run_id: str
    pipeline: str
    started_at: datetime
    ended_at: datetime
    duration_seconds: float
    status: str = Field("success", pattern="^(success|failure)$")
    parameters: Dict[str, Any]
    command: List[str]
    git: Dict[str, Any]
    stats: EtlRunStats
    artifacts: List[EtlRunArtifact]
    error: Optional[str] = None


class StructuredRunLogger:
    """JSON-lines logger dedicated to ETL runs."""

    def __init__(self, log_path: Path) -> None:
        self.log_path = log_path
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def log(self, event: str, **payload: Any) -> None:
        entry = {
            "timestamp": _utcnow().isoformat(),
            "event": event,
            **payload,
        }
        with self.log_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")


class EtlRunRecorder:
    """Collects run metadata and persists the consolidated manifest."""

    def __init__(
        self,
        monitor_dir: Path,
        pipeline: str,
        parameters: Dict[str, Any],
        command: Sequence[str],
        project_root: Optional[Path] = None,
    ) -> None:
        self.monitor_dir = monitor_dir
        self.pipeline = pipeline
        self.parameters = parameters
        self.command = list(command)
        self.project_root = project_root
        self.started_at = _utcnow()
        self._artifacts: List[EtlRunArtifact] = []
        self._log = StructuredRunLogger(monitor_dir / "_etl-run.log.jsonl")
        self.run_id = f"{self.started_at.strftime('%Y%m%dT%H%M%SZ')}:{os.getpid()}"
        self._log.log(
            "run_started",
            run_id=self.run_id,
            pipeline=self.pipeline,
            parameters=self.parameters,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def log_event(self, event: str, **payload: Any) -> None:
        self._log.log(event, run_id=self.run_id, pipeline=self.pipeline, **payload)

    def add_artifact(self, path: Path) -> None:
        if not path.exists() or not path.is_file():
            return
        try:
            rel_path = str(path.relative_to(self.project_root)) if self.project_root else str(path)
        except ValueError:
            rel_path = str(path)
        artifact = EtlRunArtifact(
            path=rel_path,
            size_bytes=path.stat().st_size,
            sha256=_sha256(path),
        )
        self._artifacts.append(artifact)

    # ------------------------------------------------------------------
    # Git metadata
    # ------------------------------------------------------------------
    def _get_git_metadata(self) -> Dict[str, Any]:
        if not self.project_root:
            return {"commit": None, "branch": None, "dirty": None}
        env = os.environ.copy()
        try:
            commit = (
                subprocess.check_output(
                    ["git", "rev-parse", "HEAD"], cwd=self.project_root, env=env
                )
                .decode()
                .strip()
            )
        except Exception:
            commit = None
        try:
            branch = (
                subprocess.check_output(
                    ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=self.project_root, env=env
                )
                .decode()
                .strip()
            )
        except Exception:
            branch = None
        try:
            status_output = subprocess.check_output(
                ["git", "status", "--porcelain"], cwd=self.project_root, env=env
            )
            dirty = bool(status_output.strip())
        except Exception:
            dirty = None
        return {
            "commit": commit,
            "branch": branch,
            "dirty": dirty,
        }

    # ------------------------------------------------------------------
    # Finalization
    # ------------------------------------------------------------------
    def finalize(
        self,
        stats: Dict[str, Any],
        duration_seconds: float,
        status: str = "success",
        error: Optional[str] = None,
    ) -> None:
        ended_at = _utcnow()
        stats_payload = EtlRunStats(
            total_legisladores=stats.get("total_legisladores", 0),
            total_fornecedores=stats.get("total_fornecedores", 0),
            total_despesas=stats.get("total_despesas", 0.0),
            deputados_processados=stats.get("deputados_processados", 0),
            deputados_solicitados=stats.get("deputados_solicitados", 0),
            duration_seconds=duration_seconds,
        )
        entry = EtlRunEntry(
            run_id=self.run_id,
            pipeline=self.pipeline,
            started_at=self.started_at,
            ended_at=ended_at,
            duration_seconds=duration_seconds,
            status=status,
            parameters=self.parameters,
            command=self.command,
            git=self._get_git_metadata(),
            stats=stats_payload,
            artifacts=self._artifacts,
            error=error,
        )

        manifest_path = self.monitor_dir / "_etl-run-manifest.json"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"version": 1, "runs": []}
        if manifest_path.exists():
            try:
                payload = json.loads(manifest_path.read_text(encoding="utf-8"))
                if "runs" not in payload or not isinstance(payload["runs"], list):
                    payload["runs"] = []
            except Exception:
                payload = {"version": 1, "runs": []}
        # Ensure JSON-serializable output (datetimes, enums, etc.)
        payload["runs"].append(entry.model_dump(mode="json"))
        payload["runs"] = payload["runs"][-25:]
        manifest_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        self._log.log(
            "run_finished",
            run_id=self.run_id,
            pipeline=self.pipeline,
            status=status,
            duration_seconds=duration_seconds,
            error=error,
        )

