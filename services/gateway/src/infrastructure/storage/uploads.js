const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

function createUploadMiddleware(uploadDir, maxUploadMb) {
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, uploadDir),
    filename: (request, file, callback) => {
      const jobId = randomUUID();
      const extension = path.extname(file.originalname || "").toLowerCase() || ".png";

      request.jobId = jobId;
      callback(null, `${jobId}${extension}`);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: maxUploadMb * 1024 * 1024
    },
    fileFilter: (_request, file, callback) => {
      if (file.mimetype && file.mimetype.startsWith("image/")) {
        callback(null, true);
        return;
      }

      callback(new Error("Only image uploads are supported."));
    }
  });
}

module.exports = {
  createUploadMiddleware
};
