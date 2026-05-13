const path = require("path");
const { ImageTranslationStatus } = require("./imageTranslation.model");

function createImageTranslationService({ repository, publishJob }) {
  async function createJobFromUpload({ file, jobId }) {
    const extension = path.extname(file.filename) || ".png";
    const outputFile = `${jobId}.vi${extension}`;
    const resultUrl = `/api/image-translations/jobs/${jobId}/result`;

    const job = await repository.create({
      jobId,
      status: ImageTranslationStatus.Queued,
      originalName: file.originalname,
      inputFile: file.filename,
      outputFile,
      resultUrl,
      error: null
    });

    await publishJob({
      jobId: job.jobId,
      inputFile: job.inputFile,
      outputFile: job.outputFile,
      requestedAt: job.createdAt.toISOString()
    });

    return job;
  }

  async function getJobById(jobId) {
    return repository.findByJobId(jobId);
  }

  async function applyCompletion(payload) {
    if (payload.ok) {
      return repository.markCompleted({
        jobId: payload.jobId,
        outputFile: payload.outputFile
      });
    }

    return repository.markFailed({
      jobId: payload.jobId,
      error: payload.error
    });
  }

  return {
    createJobFromUpload,
    getJobById,
    applyCompletion
  };
}

module.exports = {
  createImageTranslationService
};
