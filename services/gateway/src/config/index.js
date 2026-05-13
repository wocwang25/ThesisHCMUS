const env = (key, fallback) => process.env[key] || fallback;

module.exports = {
  port: Number(env("PORT", "3000")),
  mongoUrl: env("MONGO_URL", "mongodb+srv://yusato:0000@thesis-database.sgitnsc.mongodb.net/"),
  rabbitUrl: env("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672"),
  uploadDir: env("UPLOAD_DIR", "/app/uploads"),
  requestQueue: env("REQUEST_QUEUE", "image.translate.requested"),
  completionQueue: env("COMPLETION_QUEUE", "image.translate.completed"),
  clientOrigin: env("CLIENT_ORIGIN", "http://localhost:5173"),
  maxUploadMb: Number(env("MAX_UPLOAD_MB", "25"))
};
