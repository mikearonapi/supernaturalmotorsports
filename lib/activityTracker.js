/**
 * Activity Tracker
 * 
 * Utility for tracking user engagement events.
 * Works for both authenticated and anonymous users.
 * 
 * @module lib/activityTracker
 */

import { logActivity } from './userDataService';

/**
 * Event types that can be tracked
 */
export const EventTypes = {
  CAR_VIEWED: 'car_viewed',
  CAR_FAVORITED: 'car_favorited',
  CAR_UNFAVORITED: 'car_unfavorited',
  COMPARISON_STARTED: 'comparison_started',
  COMPARISON_COMPLETED: 'comparison_completed',
  BUILD_STARTED: 'build_started',
  BUILD_SAVED: 'build_saved',
  BUILD_DELETED: 'build_deleted',
  VEHICLE_ADDED: 'vehicle_added',
  AI_MECHANIC_USED: 'ai_mechanic_used',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
};

/**
 * Get or create a session ID for anonymous tracking
 * @returns {string}
 */
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('sn_session_id');
  
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('sn_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Track a user activity event
 * 
 * @param {string} eventType - One of EventTypes
 * @param {Object} eventData - Additional event context
 * @param {string} [userId] - User ID if authenticated
 * @returns {Promise<void>}
 */
export async function trackEvent(eventType, eventData = {}, userId = null) {
  try {
    await logActivity({
      userId,
      sessionId: getSessionId(),
      eventType,
      eventData,
    });
  } catch (err) {
    // Silently fail - don't interrupt user experience for tracking
    console.warn('[ActivityTracker] Failed to track event:', err);
  }
}

/**
 * Track a car view event
 * @param {string} carSlug 
 * @param {string} source - Where the view came from (search, catalog, etc.)
 * @param {string} userId 
 */
export function trackCarView(carSlug, source = 'direct', userId = null) {
  return trackEvent(EventTypes.CAR_VIEWED, { car_slug: carSlug, source }, userId);
}

/**
 * Track a car being favorited
 * @param {string} carSlug 
 * @param {string} userId 
 */
export function trackFavorite(carSlug, userId = null) {
  return trackEvent(EventTypes.CAR_FAVORITED, { car_slug: carSlug }, userId);
}

/**
 * Track a comparison being completed
 * @param {string[]} carSlugs 
 * @param {number} durationSeconds 
 * @param {string} userId 
 */
export function trackComparison(carSlugs, durationSeconds = null, userId = null) {
  return trackEvent(EventTypes.COMPARISON_COMPLETED, { 
    car_slugs: carSlugs, 
    duration_seconds: durationSeconds 
  }, userId);
}

/**
 * Track a build being saved
 * @param {string} carSlug 
 * @param {number} totalCost 
 * @param {number} hpGain 
 * @param {string} userId 
 */
export function trackBuildSaved(carSlug, totalCost, hpGain, userId = null) {
  return trackEvent(EventTypes.BUILD_SAVED, { 
    car_slug: carSlug, 
    total_cost: totalCost,
    hp_gain: hpGain,
  }, userId);
}

/**
 * Track AI Mechanic usage
 * @param {string} carSlug - Car context (if any)
 * @param {string} userId 
 */
export function trackAIMechanicUsage(carSlug = null, userId = null) {
  return trackEvent(EventTypes.AI_MECHANIC_USED, { car_slug: carSlug }, userId);
}

/**
 * Track a search being performed
 * @param {string} query 
 * @param {number} resultCount 
 * @param {string} userId 
 */
export function trackSearch(query, resultCount, userId = null) {
  return trackEvent(EventTypes.SEARCH_PERFORMED, { query, result_count: resultCount }, userId);
}

/**
 * Track a filter being applied
 * @param {Object} filters - Applied filters
 * @param {number} resultCount 
 * @param {string} userId 
 */
export function trackFilterApplied(filters, resultCount, userId = null) {
  return trackEvent(EventTypes.FILTER_APPLIED, { filters, result_count: resultCount }, userId);
}
