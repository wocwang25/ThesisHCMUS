function serializeImageTranslationJob(job) {
  if (!job) {
    return null;
  }

  const data = typeof job.toObject === "function" ? job.toObject() : job;

  return {
    jobId: data.jobId,
    status: data.status,
    originalName: data.originalName,
    inputFile: data.inputFile,
    outputFile: data.outputFile,
    resultUrl: data.resultUrl,
    error: data.error,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt
  };
}

module.exports = {
  serializeImageTranslationJob
};
