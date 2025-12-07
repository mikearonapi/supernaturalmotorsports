/**
 * Scoring Library for SuperNatural Motorsports Performance Vehicle Advisory
 * 
 * This module provides pure functions for calculating weighted scores
 * for the recommendation engine. It can be used both in the main advisory
 * component and on individual car hero pages.
 */

import { categories } from '../data/cars.js';

/**
 * Default weights (all categories equal at 1)
 */
export const DEFAULT_WEIGHTS = Object.fromEntries(
  categories.map(cat => [cat.key, 1])
);

/**
 * Calculate the weighted total score for a single car
 * @param {Object} car - Car object with score properties
 * @param {Object} weights - Object with category keys and weight values
 * @returns {number} - The weighted total score
 */
export function calculateWeightedScore(car, weights = DEFAULT_WEIGHTS) {
  return categories.reduce((sum, cat) => {
    const carScore = car[cat.key] ?? 0;
    const weight = weights[cat.key] ?? 1;
    return sum + (carScore * weight);
  }, 0);
}

/**
 * Calculate the maximum possible score based on current weights
 * (All categories at 10)
 * @param {Object} weights - Object with category keys and weight values
 * @returns {number} - The maximum possible score
 */
export function calculateMaxScore(weights = DEFAULT_WEIGHTS) {
  return categories.reduce((sum, cat) => {
    const weight = weights[cat.key] ?? 1;
    return sum + (10 * weight);
  }, 0);
}

/**
 * Calculate score breakdown for a car showing individual category contributions
 * @param {Object} car - Car object with score properties
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object[]} - Array of score breakdown objects
 */
export function calculateScoreBreakdown(car, weights = DEFAULT_WEIGHTS) {
  return categories.map(cat => {
    const rawScore = car[cat.key] ?? 0;
    const weight = weights[cat.key] ?? 1;
    const weightedScore = rawScore * weight;
    const maxWeighted = 10 * weight;
    
    return {
      key: cat.key,
      label: cat.label,
      description: cat.desc,
      rawScore,
      weight,
      weightedScore,
      maxWeighted,
      percentage: maxWeighted > 0 ? (weightedScore / maxWeighted) * 100 : 0,
    };
  });
}

/**
 * Get a rating label based on score
 * @param {number} score - Score from 1-10
 * @returns {{label: string, tier: string}}
 */
export function getScoreLabel(score) {
  if (score >= 9) return { label: 'Excellent', tier: 'excellent' };
  if (score >= 7) return { label: 'Good', tier: 'good' };
  if (score >= 5) return { label: 'Average', tier: 'average' };
  if (score >= 3) return { label: 'Below Average', tier: 'below-average' };
  return { label: 'Poor', tier: 'poor' };
}

/**
 * Get a rating label for overall score percentage
 * @param {number} score - Current score
 * @param {number} maxScore - Maximum possible score
 * @returns {{label: string, tier: string}}
 */
export function getOverallRating(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return { label: 'Exceptional Match', tier: 'exceptional' };
  if (percentage >= 65) return { label: 'Strong Match', tier: 'strong' };
  if (percentage >= 50) return { label: 'Good Match', tier: 'good' };
  return { label: 'Moderate Match', tier: 'moderate' };
}

/**
 * Sort cars by weighted total score (descending)
 * @param {Object[]} cars - Array of car objects
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object[]} - Sorted array with 'total' property added
 */
export function sortCarsByScore(cars, weights = DEFAULT_WEIGHTS) {
  return [...cars]
    .map(car => ({
      ...car,
      total: calculateWeightedScore(car, weights),
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Get the user's top priorities based on weight values
 * @param {Object} weights - Object with category keys and weight values
 * @param {number} topN - Number of top priorities to return
 * @returns {Array} - Array of {key, weight, rank} sorted by weight descending
 */
export function getTopPriorities(weights = DEFAULT_WEIGHTS, topN = 3) {
  return Object.entries(weights)
    .filter(([_, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key, weight], index) => ({
      key,
      weight,
      rank: index + 1,
    }));
}

/**
 * Get dynamic recommendation labels based on user's current weights
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object[]} - Array of recommendation type configs
 */
export function getDynamicRecommendationTypes(weights = DEFAULT_WEIGHTS) {
  const topPriorities = getTopPriorities(weights, 3);
  
  // Category to recommendation label mapping
  const categoryLabels = {
    sound: { label: 'Your Sound Pick', icon: 'sound' },
    interior: { label: 'Your Comfort Pick', icon: 'interior' },
    track: { label: 'Your Track Pick', icon: 'track' },
    reliability: { label: 'Your Reliability Pick', icon: 'reliability' },
    value: { label: 'Your Value Pick', icon: 'value' },
    driverFun: { label: 'Your Fun Pick', icon: 'driverFun' },
    aftermarket: { label: 'Your Modder Pick', icon: 'aftermarket' },
  };
  
  // Always include top match
  const recommendations = [
    { key: 'top', label: 'Your Top Match', icon: 'trophy', isPrimary: true },
  ];
  
  // Add dynamic picks based on user's top weighted priorities
  topPriorities.forEach(priority => {
    if (categoryLabels[priority.key] && priority.weight > 0) {
      recommendations.push({
        key: priority.key,
        ...categoryLabels[priority.key],
        weight: priority.weight,
        rank: priority.rank,
      });
    }
  });
  
  // If user has very few priorities weighted, show some defaults
  if (recommendations.length < 4) {
    const defaultPicks = ['value', 'reliability', 'track'];
    defaultPicks.forEach(key => {
      if (!recommendations.find(r => r.key === key) && recommendations.length < 5) {
        recommendations.push({
          key,
          ...categoryLabels[key],
          isDefault: true,
        });
      }
    });
  }
  
  return recommendations;
}

/**
 * Get personalized recommendations based on weights and filtered cars
 * Now fully dynamic based on user's actual priorities
 * @param {Object[]} filteredCars - Array of car objects (already filtered)
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object} - Object with recommendation keys and car objects
 */
export function getRecommendations(filteredCars, weights = DEFAULT_WEIGHTS) {
  if (!filteredCars || filteredCars.length === 0) {
    return {
      top: null,
      // Return nulls for all possible category keys
      sound: null,
      interior: null,
      track: null,
      reliability: null,
      value: null,
      driverFun: null,
      aftermarket: null,
    };
  }

  // Add total scores to all cars
  const carsWithScores = filteredCars.map(car => ({
    ...car,
    total: calculateWeightedScore(car, weights),
  }));

  // Sort by total score for top match
  const sortedByTotal = [...carsWithScores].sort((a, b) => b.total - a.total);

  // Build recommendations object dynamically
  const recommendations = {
    // Top overall match based on user's weights
    top: sortedByTotal[0],
  };
  
  // Add best car for each category, weighted by user priority
  // This finds the car that scores best in each category
  const categoryKeys = ['sound', 'interior', 'track', 'reliability', 'value', 'driverFun', 'aftermarket'];
  
  categoryKeys.forEach(key => {
    // Sort by the category score, with tiebreaker on total weighted score
    const sorted = [...carsWithScores].sort((a, b) => {
      const catDiff = (b[key] || 0) - (a[key] || 0);
      if (catDiff !== 0) return catDiff;
      return b.total - a.total;
    });
    recommendations[key] = sorted[0];
  });

  return recommendations;
}

/**
 * Legacy recommendation getter for backwards compatibility
 * Maps old recommendation keys to new structure
 */
export function getLegacyRecommendations(filteredCars, weights = DEFAULT_WEIGHTS) {
  const recs = getRecommendations(filteredCars, weights);
  return {
    top: recs.top,
    sound: recs.sound,
    track: recs.track,
    value: recs.value,
    reliable: recs.reliability,
    modder: recs.aftermarket,
  };
}

/**
 * Get top N cars by weighted score
 * @param {Object[]} cars - Array of car objects
 * @param {Object} weights - Object with category keys and weight values
 * @param {number} n - Number of top cars to return
 * @returns {Object[]} - Top N cars with total scores
 */
export function getTopNCars(cars, weights = DEFAULT_WEIGHTS, n = 5) {
  return sortCarsByScore(cars, weights).slice(0, n);
}

/**
 * Find the best car for a specific category
 * @param {Object[]} cars - Array of car objects
 * @param {string} categoryKey - The category key to find the best car for
 * @returns {Object|null} - The car with the highest score in that category
 */
export function getBestCarForCategory(cars, categoryKey) {
  if (!cars || cars.length === 0) return null;
  
  return [...cars].sort((a, b) => 
    (b[categoryKey] ?? 0) - (a[categoryKey] ?? 0)
  )[0];
}

/**
 * Compare two cars and return the differences
 * @param {Object} carA - First car
 * @param {Object} carB - Second car
 * @param {Object} weights - Object with category keys and weight values
 * @returns {Object} - Comparison object with differences
 */
export function compareCars(carA, carB, weights = DEFAULT_WEIGHTS) {
  const totalA = calculateWeightedScore(carA, weights);
  const totalB = calculateWeightedScore(carB, weights);
  
  return {
    carA: { ...carA, total: totalA },
    carB: { ...carB, total: totalB },
    totalDifference: totalA - totalB,
    winner: totalA >= totalB ? carA : carB,
    categoryComparisons: categories.map(cat => ({
      key: cat.key,
      label: cat.label,
      scoreA: carA[cat.key] ?? 0,
      scoreB: carB[cat.key] ?? 0,
      difference: (carA[cat.key] ?? 0) - (carB[cat.key] ?? 0),
      winner: (carA[cat.key] ?? 0) >= (carB[cat.key] ?? 0) ? 'A' : 'B',
    })),
  };
}

export default {
  calculateWeightedScore,
  calculateMaxScore,
  calculateScoreBreakdown,
  getScoreLabel,
  getOverallRating,
  sortCarsByScore,
  getRecommendations,
  getTopNCars,
  getBestCarForCategory,
  compareCars,
  DEFAULT_WEIGHTS,
};

