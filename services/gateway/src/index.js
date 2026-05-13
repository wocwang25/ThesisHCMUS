const http = require("http");
const cors = require("cors");
const express = require("express");
const { Server } = require("socket.io");
const config = require("./config");
const { connectMongo, closeMongo } = require("./infrastructure/database/mongo");
const { createMessageBroker } = require("./infrastructure/messaging/rabbitmq");
const { createUploadMiddleware } = require("./infrastructure/storage/uploads");
const { createImageTranslationModule } = require("./modules/image-translation");

async function start() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.clientOrigin,
      methods: ["GET", "POST"]
    }
  });

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());
  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "gateway" });
  });

  await connectMongo(config.mongoUrl);
  const broker = await createMessageBroker(config);

  io.on("connection", (socket) => {
    socket.on("image-translation:join-job", (jobId) => {
      if (typeof jobId === "string" && jobId.length > 0) {
        socket.join(jobId);
      }
    });

    socket.on("join-job", (jobId) => {
      if (typeof jobId === "string" && jobId.length > 0) {
        socket.join(jobId);
      }
    });
  });

  const upload = createUploadMiddleware(config.uploadDir, config.maxUploadMb);
  const imageTranslationModule = await createImageTranslationModule({
    config,
    broker,
    io,
    upload
  });

  app.use("/api/image-translations", imageTranslationModule.router);

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ message: error.message || "Unexpected gateway error." });
  });

  server.listen(config.port, () => {
    console.log(`Gateway listening on port ${config.port}`);
  });

  const shutdown = async () => {
    console.log("Gateway shutting down.");
    await broker.close();
    await closeMongo();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  console.error("Gateway failed to start.", error);
  process.exit(1);
});
