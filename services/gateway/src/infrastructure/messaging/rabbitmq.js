const amqp = require("amqplib");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectWithRetry(rabbitUrl) {
  for (;;) {
    try {
      return await amqp.connect(rabbitUrl);
    } catch (error) {
      console.error("RabbitMQ connection failed. Retrying in 3s.", error.message);
      await delay(3000);
    }
  }
}

async function createMessageBroker(config) {
  const connection = await connectWithRetry(config.rabbitUrl);
  const channel = await connection.createChannel();

  async function assertQueue(queueName) {
    await channel.assertQueue(queueName, { durable: true });
  }

  async function publishJson(queueName, payload) {
    await assertQueue(queueName);
    const body = Buffer.from(JSON.stringify(payload));
    return channel.sendToQueue(queueName, body, {
      contentType: "application/json",
      persistent: true
    });
  }

  async function consumeJson(queueName, handler, options = {}) {
    await assertQueue(queueName);
    await channel.prefetch(options.prefetch || 10);

    await channel.consume(queueName, async (message) => {
      if (!message) {
        return;
      }

      try {
        const payload = JSON.parse(message.content.toString("utf8"));
        await handler(payload);
        channel.ack(message);
      } catch (error) {
        console.error(`Failed to consume message from ${queueName}.`, error);
        channel.nack(message, false, false);
      }
    });
  }

  async function closeQueue() {
    await channel.close();
    await connection.close();
  }

  return {
    assertQueue,
    publishJson,
    consumeJson,
    close: closeQueue
  };
}

module.exports = {
  createMessageBroker
};
