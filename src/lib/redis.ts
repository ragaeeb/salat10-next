import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for analytics and presence tracking
 * Uses REST API for edge compatibility
 */
export const redis = Redis.fromEnv();

/**
 * Keys structure:
 * - analytics:pageviews:{path} - Counter for page views
 * - analytics:events:{userId} - List of pending events (localStorage batch)
 * - presence:{sessionId} - Hash with {lat, lon, page, lastSeen}
 * - presence:active - Sorted set of active sessions (score = timestamp)
 */

export const REDIS_KEYS = {
    activePresence: 'presence:active',
    events: (userId: string) => `analytics:events:${userId}`,
    pageView: (path: string) => `analytics:pageviews:${path}`,
    presence: (sessionId: string) => `presence:${sessionId}`,
} as const;

/**
 * TTL constants (in seconds)
 */
export const REDIS_TTL = {
    events: 24 * 60 * 60, // 24 hours for batched events
    presence: 5 * 60, // 5 minutes - consider user offline after this
} as const;
