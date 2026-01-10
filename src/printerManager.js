// Printer Manager module
import { Readable } from "node:stream";
import fs from "node:fs";
import sharp from "sharp";
import { ImageEncoder, printImage, initClient } from "@mmote/niimblue-node";
import { createLogger } from "./logger.js";

const logger = createLogger("PrinterManager");

export class PrinterManager {
  /**
   * Create Printer Manager
   * @param {Object} config - Printer configuration
   * @param {string} config.transport - type of transport for printer connection
   * @param {string} config.address - address for printer connection
   * @param {string} config.outputFile - Output file for received images
   */
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  /**
   * Print image to Niimbot printer
   * @param {Buffer} imageData - Image data to print
   * @returns {Promise<void>}
   */
  async printImage(imageData) {
    logger.info("Starting print process");

    try {
      // Save image to file for debugging
      fs.writeFileSync(this.config.outputFile, imageData);
      logger.debug(`Image saved to: ${this.config.outputFile}`);

      // Initialize printer client
      this.client = initClient(this.config.transport, this.config.address, false);
      await this.client.connect();
      logger.info("Connected to printer");

      // Get printer information
      const dir = this.client.getModelMetadata()?.printDirection;
      const task = this.client.getPrintTaskType();

      if (!task) {
        throw new Error("Unable to detect print task for this printer");
      }

      logger.debug(`Print direction: ${dir}, Task type: ${task}`);

      // Process and print image
      const imageStream = Readable.from(imageData).pipe(sharp());
      const encoded = await ImageEncoder.encodeImage(imageStream, dir);

      const printerInfo = this.client.getPrinterInfo();
      logger.debug(`Printer info: ${JSON.stringify(printerInfo)}`);

      await printImage(this.client, task, encoded, {
        quantity: 1,
        labelType: printerInfo?.labelType ?? 0,
        density: printerInfo?.density ?? 3,
      });

      logger.info("Printing completed successfully");
    } catch (error) {
      logger.error("Printing failed:", error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Disconnect from printer
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.disconnect();
        logger.info("Disconnected from printer");
      } catch (error) {
        logger.error("Error disconnecting from printer:", error);
      }
      this.client = null;
    }
  }
}