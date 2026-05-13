const { createImageTranslationRoutes } = require("./imageTranslation.routes");
const { createImageTranslationRepository } = require("./imageTranslation.repository");
const { createImageTranslationService } = require("./imageTranslation.service");
const { createImageTranslationController } = require("./imageTranslation.controller");
const { registerImageTranslationCompletionConsumer } = require("./imageTranslation.completions");

async function createImageTranslationModule({ config, broker, io, upload }) {
  const repository = createImageTranslationRepository();
  await repository.ensureIndexes();
  await broker.assertQueue(config.requestQueue);
  await broker.assertQueue(config.completionQueue);

  const service = createImageTranslationService({
    repository,
    publishJob: (payload) => broker.publishJson(config.requestQueue, payload)
  });
  const controller = createImageTranslationController({
    service,
    uploadDir: config.uploadDir
  });

  await registerImageTranslationCompletionConsumer({
    broker,
    config,
    service,
    io
  });

  const router = createImageTranslationRoutes({
    controller,
    upload
  });

  return {
    router
  };
}

module.exports = {
  createImageTranslationModule
};
