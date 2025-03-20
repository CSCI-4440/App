// manager.js
// Developer: This file contains a class to manage routes and locations.

const Route = require('./Route');
const Location = require('./Location');

class Manager {
  /**
   * Calculate a score for a route based on weather, time, and distance.
   * We want routes with good weather (high weatherScore) and lower time and distance.
   *
   * @param {Object} route - The route object with properties: time, distance, weatherScore.
   * @param {number} maxTime - Maximum travel time among all routes (for normalization).
   * @param {number} maxDistance - Maximum distance among all routes (for normalization).
   * @returns {number} - The computed score.
   */
  static scoreRoute(route, maxTime, maxDistance) {
    // Set weights for each criterion.
    const weightWeather = 0.5;   // Weather is very important.
    const weightTime = 0.25;     // Lower time is better.
    const weightDistance = 0.25; // Lower distance is better.

    // Normalize time: lower travel time gives a higher normalized score.
    const timeScore = maxTime ? (maxTime - route.time) / maxTime : 0;
    // Normalize distance: shorter distance gives a higher normalized score.
    const distanceScore = maxDistance ? (maxDistance - route.distance) / maxDistance : 0;
    
    const weatherScore = route.weatherScore;

    // Combine the three criteria.
    return (route.weatherScore * weightWeather) +
           (timeScore * weightTime) +
           (distanceScore * weightDistance);
  }

  /**
   * Get the best routes based on a scoring algorithm.
   *
   * @param {Array} routes - Array of route objects.
   * @param {number} count - Number of best routes to return (default is 3).
   * @returns {Array} - The top routes based on the computed score.
   */
  static getBestRoutes(routes, count = 3) {
    if (!routes || routes.length === 0) {
      return [];
    }

    // Determine the maximum values for time and distance across all routes.
    const maxTime = Math.max(...routes.map(r => r.time));
    const maxDistance = Math.max(...routes.map(r => r.distance));

    // Compute and attach a score for each route.
    routes.forEach(route => {
      route.score = Manager.scoreRoute(route, maxTime, maxDistance);
    });

    // Sort the routes by score (highest first) and return the top 'count' routes.
    const sortedRoutes = routes.sort((a, b) => b.score - a.score);
    return sortedRoutes.slice(0, count);
  }
}

module.exports = Manager;
