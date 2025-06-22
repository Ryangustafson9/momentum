// Centralized logger utility for MomentumApp
// Only logs info/warn in development, always logs errors

export const logger = {
  info: (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  warn: (...args) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
  error: (...args) => {
    console.error(...args); // keep errors visible in prod
  }
};
