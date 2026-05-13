const { ImageTranslationJob } = require("./imageTranslation.model");

function createImageTranslationRepository() {
  async function ensureIndexes() {
    await ImageTranslationJob.init();
  }

  async function create(job) {
    return ImageTranslationJob.create(job);
  }

  async function findByJobId(jobId) {
    return ImageTranslationJob.findOne({ jobId }).exec();
  }

  async function markCompleted({ jobId, outputFile }) {
    const now = new Date();

    return ImageTranslationJob.findOneAndUpdate(
      { jobId },
      {
        $set: {
          status: "completed",
          outputFile,
          completedAt: now,
          error: null,
          updatedAt: now
        }
      },
      { new: true }
    ).exec();
  }

  async function markFailed({ jobId, error }) {
    const now = new Date();

    return ImageTranslationJob.findOneAndUpdate(
      { jobId },
      {
        $set: {
          status: "failed",
          error: error || "Worker failed to process the image.",
          completedAt: null,
          updatedAt: now
        }
      },
      { new: true }
    ).exec();
  }

  return {
    ensureIndexes,
    create,
    findByJobId,
    markCompleted,
    markFailed
  };
}

module.exports = {
  createImageTranslationRepository
};
