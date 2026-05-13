import json
import time
from typing import Any

import pika

from app.core.config import Settings
from app.modules.image_translation.processor import ImageTranslationProcessor


class RabbitMQWorker:
    def __init__(self, settings: Settings, processor: ImageTranslationProcessor):
        self.settings = settings
        self.processor = processor
        self.connection: pika.BlockingConnection | None = None
        self.channel: pika.channel.Channel | None = None
        self.running = False

    def run_forever(self) -> None:
        self.running = True

        while self.running:
            try:
                self._connect()
                assert self.channel is not None

                self.channel.basic_qos(prefetch_count=1)
                self.channel.basic_consume(
                    queue=self.settings.request_queue,
                    on_message_callback=self._handle_message,
                )
                print(f"{self.settings.worker_name} waiting for jobs.")
                self.channel.start_consuming()
            except Exception as error:
                print(f"Worker loop failed. Retrying in 3s. Error: {error}")
                self._close()
                time.sleep(3)

    def stop(self) -> None:
        self.running = False
        self._close()

    def _connect(self) -> None:
        parameters = pika.URLParameters(self.settings.rabbit_url)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.settings.request_queue, durable=True)
        self.channel.queue_declare(queue=self.settings.completion_queue, durable=True)

    def _handle_message(self, channel: pika.channel.Channel, method: Any, _properties: Any, body: bytes) -> None:
        try:
            payload = json.loads(body.decode("utf-8"))
            completion = self.processor.process(payload)
            self._publish_completion(completion)
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as error:
            print(f"Job failed: {error}")
            try:
                payload = json.loads(body.decode("utf-8"))
                self._publish_completion({
                    "jobId": payload.get("jobId"),
                    "ok": False,
                    "error": str(error),
                    "worker": self.settings.worker_name,
                })
                channel.basic_ack(delivery_tag=method.delivery_tag)
            except Exception:
                channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def _publish_completion(self, payload: dict[str, Any]) -> None:
        assert self.channel is not None
        self.channel.basic_publish(
            exchange="",
            routing_key=self.settings.completion_queue,
            body=json.dumps(payload).encode("utf-8"),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,
            ),
        )

    def _close(self) -> None:
        if self.channel and self.channel.is_open:
            self.channel.close()
        if self.connection and self.connection.is_open:
            self.connection.close()
