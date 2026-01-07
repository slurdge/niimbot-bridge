// pnpm install mqtt dotenv sharp @mmote/niimblue-node
import "dotenv/config";
import Readable from "node:stream";
import fs from "node:fs";
import mqtt from "mqtt";
import sharp from "sharp";
import { ImageEncoder, printImage, initClient } from "@mmote/niimblue-node";

const {
  MQTT_BROKER,  // mqtts://broker.example.com:8883
  MQTT_TOPIC,   // homebox/labels
  MQTT_USERNAME,
  MQTT_PASSWORD,
  COM_PORT,     // COM8  (Windows) or /dev/ttyUSB0 (Linux)
} = process.env;

const OUTPUT_FILE = "frame.png";

const mqttOptions = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  rejectUnauthorized: true,
};

const sub = mqtt.connect(MQTT_BROKER, mqttOptions);

sub.on("connect", () => sub.subscribe(MQTT_TOPIC, { qos: 0 }));

sub.on("message", async (_topic, payload) => {
  fs.writeFileSync(OUTPUT_FILE, payload);
  sub.end();

  // return;

  const client = initClient("serial", COM_PORT, false);

  try {
    await client.connect();
    const dir = client.getModelMetadata()?.printDirection;
    const task = client.getPrintTaskType();
    if (!task) throw new Error("Unable to detect print task for this printer");

    const imageStream = Readable.from(payload).pipe(sharp());
    const encoded = await ImageEncoder.encodeImage(imageStream, dir);

    await printImage(client, task, encoded, {
      quantity: 1,
      labelType: client.getPrinterInfo()?.labelType ?? 0,
      density: client.getPrinterInfo()?.density ?? 3,
    });
  } finally {
    await client.disconnect();
    sub.end();
  }
});
