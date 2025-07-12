// DEPRECATED: Use @/lib/logger instead
// This file is kept for backward compatibility only

import { logger as newLogger } from '@/lib/logger';

console.warn('⚠️ DEPRECATED: src/utils/logger.js is deprecated. Use @/lib/logger instead.');

export const logger = newLogger;
