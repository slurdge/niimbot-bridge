# Niimbot MQTT Bridge

MQTT to Niimbot printer bridge.

## Setup

1. Copy `.env.example` to `.env`
2. Configure MQTT and printer settings
3. Run: `pnpm run start`

## Configuration

```
MQTT_BROKER=mqtts://broker.example.com:8883
MQTT_TOPIC=homebox/labels
MQTT_USERNAME=user
MQTT_PASSWORD=pass
COM_PORT=COM3
OMIT_FIRST_PICTURE=true  # Optional: Skip the first picture received
```
