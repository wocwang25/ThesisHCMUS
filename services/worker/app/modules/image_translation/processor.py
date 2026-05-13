import time
from pathlib import Path
from typing import Any

from .pipeline import run_debackx_placeholder


class ImageTranslationProcessor:
    def __init__(self, upload_dir: Path, worker_name: str):
        self.upload_dir = upload_dir
        self.worker_name = worker_name

    def process(self, payload: dict[str, Any]) -> dict[str, Any]:
        started_at = time.monotonic()
        job_id = payload["jobId"]
        input_file = payload["inputFile"]
        output_file = payload["outputFile"]

        input_path = self._inside_upload_dir(input_file)
        output_path = self._inside_upload_dir(output_file)

        run_debackx_placeholder(input_path, output_path)

        return {
            "jobId": job_id,
            "ok": True,
            "outputFile": output_file,
            "durationMs": int((time.monotonic() - started_at) * 1000),
            "worker": self.worker_name,
        }

    def _inside_upload_dir(self, filename: str) -> Path:
        candidate = (self.upload_dir / filename).resolve()
        upload_root = self.upload_dir.resolve()

        if upload_root not in candidate.parents and candidate != upload_root:
            raise ValueError("Invalid file path outside upload directory.")

        return candidate
