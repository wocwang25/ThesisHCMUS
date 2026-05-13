const mongoose = require("mongoose");

async function connectMongo(mongoUrl) {
  await mongoose.connect(mongoUrl);
  return mongoose.connection;
}

async function closeMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectMongo,
  closeMongo
};
