// Main application entry point
import "dotenv/config";
import { createLogger } from "./logger.js";
import { MQTTClient } from "./mqttClient.js";
import { PrinterManager } from "./printerManager.js";

const logger = createLogger("main");
const config = {
mqtt: {
    broker: process.env.MQTT_BROKER,
    topic: process.env.MQTT_TOPIC,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
},
printer: {
    comPort: process.env.COM_PORT,
    outputFile: process.env.OUTPUT_FILE || "label.png"
},
omitFirstPicture: process.env.OMIT_FIRST_PICTURE === 'true'
};

async function main() {
  try {
    logger.info("Starting Niimbot Bridge application");

    // Initialize MQTT client
    const mqttClient = new MQTTClient(config.mqtt);
    await mqttClient.connect();

    // Initialize printer manager
    const printerManager = new PrinterManager(config.printer);

    // Track if we've received the first picture
    let firstPictureReceived = false;

    // Set up message handler
    mqttClient.onMessage(async (topic, payload) => {
      try {
        logger.info(`Received message on topic: ${topic}`);

        // Skip first picture if option is enabled
        if (config.omitFirstPicture && !firstPictureReceived) {
          logger.info("Skipping first picture as per configuration");
          firstPictureReceived = true;
          return;
        }

        await printerManager.printImage(payload);
      } catch (error) {
        logger.error("Error processing message:", error);
      }
    });

    logger.info("Application started successfully");
  } catch (error) {
    logger.error("Fatal error starting application:", error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", async () => {
  logger.info("Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection:", reason);
  process.exit(1);
});

// Start the application
main();