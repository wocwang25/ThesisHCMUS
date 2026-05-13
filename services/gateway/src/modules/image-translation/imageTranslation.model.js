const mongoose = require("mongoose");

const ImageTranslationStatus = Object.freeze({
  Queued: "queued",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed"
});

const imageTranslationJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(ImageTranslationStatus),
      default: ImageTranslationStatus.Queued,
      index: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    inputFile: {
      type: String,
      required: true,
      trim: true
    },
    outputFile: {
      type: String,
      required: true,
      trim: true
    },
    resultUrl: {
      type: String,
      required: true,
      trim: true
    },
    error: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    collection: "imageTranslationJobs",
    timestamps: true,
    versionKey: false
  }
);

imageTranslationJobSchema.index({ createdAt: -1 });
imageTranslationJobSchema.index({ status: 1, updatedAt: -1 });

const ImageTranslationJob =
  mongoose.models.ImageTranslationJob ||
  mongoose.model("ImageTranslationJob", imageTranslationJobSchema);

module.exports = {
  ImageTranslationJob,
  ImageTranslationStatus
};
