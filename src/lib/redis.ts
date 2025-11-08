import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for analytics and presence tracking
 * Uses REST API for edge function compatibility
 * Configured from UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars
 */
export const redis = Redis.fromEnv();

/**
 * Redis key structure definitions for consistent key naming
 *
 * Key patterns:
 * - analytics:pageviews:{path} - Counter for each page path
 * - analytics:events:{userId} - List of batched events per user
 * - presence:{sessionId} - Hash with user location and metadata
 * - presence:active - Sorted set of active sessions (score = timestamp)
 */
export const REDIS_KEYS = {
    /** Sorted set of active session IDs with timestamps */
    activePresence: 'presence:active',
    /** Get key for user's event list */
    events: (userId: string) => `analytics:events:${userId}`,
    /** Get key for page view counter */
    pageView: (path: string) => `analytics:pageviews:${path}`,
    /** Get key for session presence data */
    presence: (sessionId: string) => `presence:${sessionId}`,
} as const;

/**
 * TTL (Time To Live) constants in seconds
 * Controls how long data persists in Redis before automatic expiration
 */
export const REDIS_TTL = {
    /** Batched events expire after 24 hours */
    events: 24 * 60 * 60,
    /** User presence expires after 5 minutes of inactivity */
    presence: 5 * 60,
} as const;
