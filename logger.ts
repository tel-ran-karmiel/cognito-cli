import pino, { Logger } from "pino";
const logger: Logger = pino({
  level: process.env.LOGGER_LEVEL || "info",
  base: undefined,
  timestamp: false,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});
export default logger