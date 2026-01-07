// MQTT Client module
import mqtt from "mqtt";
import { createLogger } from "./logger.js";

const logger = createLogger("MQTTClient");

export class MQTTClient {
  /**
   * Create MQTT Client
   * @param {Object} config - MQTT configuration
   * @param {string} config.broker - MQTT broker URL
   * @param {string} config.topic - MQTT topic to subscribe to
   * @param {string} config.username - MQTT username
   * @param {string} config.password - MQTT password
   */
  constructor(config) {
    this.config = config;
    this.client = null;
    this.messageHandler = null;
  }

  /**
   * Connect to MQTT broker
   * @returns {Promise<void>}
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        logger.info(`Connecting to MQTT broker: ${this.config.broker}`);

        this.client = mqtt.connect(this.config.broker, {
          username: this.config.username,
          password: this.config.password
        });

        this.client.on("connect", () => {
          logger.info("MQTT connection established");
          this.client.subscribe(this.config.topic, { qos: 0 }, (err) => {
            if (err) {
              logger.error("MQTT subscription error:", err);
              reject(err);
            } else {
              logger.info(`Subscribed to topic: ${this.config.topic}`);
              resolve();
            }
          });
        });

        this.client.on("error", (error) => {
          logger.error("MQTT connection error:", error);
          reject(error);
        });

        this.client.on("message", (topic, payload) => {
          if (this.messageHandler) {
            this.messageHandler(topic, payload);
          }
        });

        this.client.on("close", () => {
          logger.info("MQTT connection closed");
        });

        this.client.on("offline", () => {
          logger.warn("MQTT client went offline");
        });

        this.client.on("reconnect", () => {
          logger.info("MQTT client reconnecting...");
        });
      } catch (error) {
        logger.error("MQTT connection failed:", error);
        reject(error);
      }
    });
  }

  /**
   * Set message handler callback
   * @param {Function} handler - Function to handle incoming messages
   */
  onMessage(handler) {
    this.messageHandler = handler;
  }

  /**
   * Disconnect from MQTT broker
   * @returns {Promise<void>}
   */
  async disconnect() {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(true, {}, () => {
          logger.info("MQTT client disconnected");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if client is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.client && this.client.connected;
  }
}