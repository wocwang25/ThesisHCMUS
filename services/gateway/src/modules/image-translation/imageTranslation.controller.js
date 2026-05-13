const path = require("path");
const { ImageTranslationStatus } = require("./imageTranslation.model");
const { serializeImageTranslationJob } = require("./imageTranslation.serializer");

function createImageTranslationController({ service, uploadDir }) {
  function health(_request, response) {
    response.json({ ok: true, service: "gateway" });
  }

  async function createJob(request, response) {
    if (!request.file) {
      response.status(400).json({ message: "Image file is required." });
      return;
    }

    const job = await service.createJobFromUpload({
      file: request.file,
      jobId: request.jobId
    });

    response.status(202).json(serializeImageTranslationJob(job));
  }

  async function getJob(request, response) {
    const job = await service.getJobById(request.params.jobId);

    if (!job) {
      response.status(404).json({ message: "Job not found." });
      return;
    }

    response.json(serializeImageTranslationJob(job));
  }

  async function getResult(request, response) {
    const job = await service.getJobById(request.params.jobId);

    if (!job) {
      response.status(404).json({ message: "Job not found." });
      return;
    }

    if (job.status !== ImageTranslationStatus.Completed) {
      response.status(409).json({ message: "Job has not completed yet.", status: job.status });
      return;
    }

    response.sendFile(path.join(uploadDir, job.outputFile));
  }

  return {
    health,
    createJob,
    getJob,
    getResult
  };
}

module.exports = {
  createImageTranslationController
};
