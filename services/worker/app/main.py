import threading

from fastapi import FastAPI

from app.core.config import settings
from app.infrastructure.messaging.rabbitmq_worker import RabbitMQWorker
from app.modules.image_translation.processor import ImageTranslationProcessor


app = FastAPI(title="DebackX Worker", version="0.1.0")
image_translation_processor = ImageTranslationProcessor(settings.upload_dir, settings.worker_name)
worker_queue = RabbitMQWorker(settings, image_translation_processor)
worker_thread: threading.Thread | None = None


@app.on_event("startup")
def start_worker() -> None:
    global worker_thread
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    worker_thread = threading.Thread(target=worker_queue.run_forever, daemon=True)
    worker_thread.start()


@app.on_event("shutdown")
def stop_worker() -> None:
    worker_queue.stop()


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "ok": True,
        "service": "worker",
        "worker": settings.worker_name,
    }
