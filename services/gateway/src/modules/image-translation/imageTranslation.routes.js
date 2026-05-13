const express = require("express");

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function createImageTranslationRoutes({ controller, upload }) {
  const router = express.Router();

  router.get("/health", controller.health);
  router.post("/jobs", upload.single("image"), asyncRoute(controller.createJob));
  router.get("/jobs/:jobId", asyncRoute(controller.getJob));
  router.get("/jobs/:jobId/result", asyncRoute(controller.getResult));

  return router;
}

module.exports = {
  createImageTranslationRoutes
};
