const { serializeImageTranslationJob } = require("./imageTranslation.serializer");

async function registerImageTranslationCompletionConsumer({ broker, config, service, io }) {
  await broker.consumeJson(config.completionQueue, async (payload) => {
    const job = await service.applyCompletion(payload);

    if (job) {
      const serializedJob = serializeImageTranslationJob(job);
      io.to(payload.jobId).emit("image-translation:job-update", serializedJob);
      io.to(payload.jobId).emit("job:update", serializedJob);
    }
  });
}

module.exports = {
  registerImageTranslationCompletionConsumer
};
