import os
from dataclasses import dataclass
from pathlib import Path


def env(key: str, fallback: str) -> str:
    return os.getenv(key, fallback)


@dataclass(frozen=True)
class Settings:
    rabbit_url: str = env("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672")
    upload_dir: Path = Path(env("UPLOAD_DIR", "/app/uploads"))
    request_queue: str = env("REQUEST_QUEUE", "image.translate.requested")
    completion_queue: str = env("COMPLETION_QUEUE", "image.translate.completed")
    worker_name: str = env("WORKER_NAME", "debackx-worker")


settings = Settings()
