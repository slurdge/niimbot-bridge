// Simple logger implementation
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { format } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, "../logs");
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create log file streams
const combinedLogStream = createWriteStream(join(logsDir, "combined.log"), { flags: "a" });

/**
 * Create a logger instance
 * @param {string} moduleName - Name of the module for logging context
 * @returns {Object} Logger object with info, error, warn, debug methods
 */
export function createLogger(moduleName) {
  return {
    info: (...args) => log("INFO", moduleName, ...args),
    error: (...args) => log("ERROR", moduleName, ...args),
    warn: (...args) => log("WARN", moduleName, ...args),
    debug: (...args) => log("DEBUG", moduleName, ...args)
  };
}

/**
 * Log message with timestamp and module context
 * @param {string} level - Log level
 * @param {string} module - Module name
 * @param {...any} args - Log arguments
 */
function log(level, module, ...args) {
  const timestamp = new Date().toISOString();
  const message = format(...args);
  const logEntry = `${timestamp} [${module}] ${level}: ${message}\n`;

  // Always log to console
  console[level.toLowerCase() === "error" ? "error" : "log"](logEntry.trim());

  // Log to combined file
  combinedLogStream.write(logEntry);
}