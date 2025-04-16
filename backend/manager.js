/**
 * @file manager.js
 * @description This file contains the Manager class, which manages a collection of routes.
 * It provides methods to add routes, calculate scores based on weather and distance,
 * and retrieve the best routes based on these scores.
 * @author RINER team
 * @date 2025-04-10
 * @requires Route
 * @requires Location
 * @module Manager
 */

const Route = require("./Route");
const Location = require("./Location");

/**
 * @class Manager
 * @description This class manages a collection of routes and provides methods to add routes,
 * calculate scores based on weather and distance, and retrieve the best routes.
 * @property {Array} routes - An array to store all routes.
 * @property {Array} routesDiffTime - An array to store routes with different start times.
 * @property {Array} timeSuggestions - An array of time suggestions for route adjustments.
 * @method addRoute(route) - Adds a route to the collection of routes.
 * @method isPast(time) - Checks if a given time is in the past.
 * @method updateTime(oldTime, intervalHours) - Updates the time by adding a specified interval.
 * @method addRoutesDiffTime() - Adds routes with different start times based on suggestions.
 * @method getBestTimedRoute() - Retrieves the best route based on time and distance.
 * @method scoreRoute(route, maxTime, maxDistance) - Calculates a score for a route based on weather, time, and distance.
 * @method getBestRoute() - Retrieves the best route based on the scoring algorithm.
 * @method getTopRoutes(count) - Retrieves the top routes based on the scoring algorithm.
 * @static
 */
class Manager {
  constructor(settings) {
    // Store all routes here
    this.routes = [];
    this.routesDiffTime = [];
    this.timeSuggestions = [-6, -3, -2, -1, 1, 2, 3, 6];
    this.settings = settings;
  }

  /**
   * Add a route to the collection of routes.
   * @param {Object} route - The route object to be added.
   */
  addRoute(route) {
    this.routes.push(route);
  }

  /**
   * @method isPast
   * @description Check if a given time is in the past.
   * @param {Date} time - The time to check.
   * @returns
   */
  isPast(time) {
    const now = new Date();
    return time.getTime() <= now.getTime();
  }

  /**
   * @method updateTime
   * @description Update the time by adding a specified interval in hours.
   * @param {Date} oldTime - The original time.
   * @param {number} intervalHours - The number of hours to add.
   * @returns {Date} - The updated time.
   */
  updateTime(oldTime, intervalHours) {
    const updated = new Date(oldTime); // Clone to avoid mutating original
    updated.setHours(updated.getHours() + intervalHours);
    return updated;
  }

  /**
   * @method addRoutesDiffTime
   * @description Adds routes with different start times based on suggestions.
   * @returns {void}
   */
  addRoutesDiffTime() {
    let baseTime = this.routes[0].startDate;
    for (let changeTime of this.timeSuggestions) {
      let newStartTime = this.updateTime(baseTime, changeTime);
      if (this.isPast(newStartTime)) {
        continue;
      }
      for (let route of this.routes) {
        let newStartTimeRoute = Route.clone(route);
        newStartTimeRoute.setStartDate = newStartTime;
        newStartTimeRoute.updateTimesAndConditions(changeTime);
        //HAVE TO FIGURE HOW TO UPDATE CONDITIONS
        newStartTimeRoute.calculateWeatherScore(this.settings);
        this.routesDiffTime.push(newStartTimeRoute);
      }
    }
  }

  /**
   * @method getBestTimedRoute
   * @description Retrieves the best route based on time and distance.
   * @returns {Array} - The best route based on the computed score.
   * @static
   */
  getBestTimedRoute() {
    // Determine the maximum values for time and distance across all routes.
    const maxTime = Math.max(...this.routesDiffTime.map((r) => r.time));
    const maxDistance = Math.max(...this.routesDiffTime.map((r) => r.distance));

    // Compute and attach a score for each route.
    this.routesDiffTime.forEach((route) => {
      route.score = Manager.scoreRoute(route, maxTime, maxDistance);
    });

    // Sort the routes by score (highest first) and return the top 'count' routes.
    const sortedRoutes = this.routesDiffTime.sort((a, b) => a.score - b.score);
    return sortedRoutes.slice(0, 1);
  }

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
    const weightWeather = 0.5; // Weather is very important.
    const weightTime = 0.25; // Lower time is better.
    const weightDistance = 0.25; // Lower distance is better.

    // Normalize time: lower travel time gives a higher normalized score.
    const timeScore = maxTime ? (maxTime - route.time) / maxTime : 0;
    // Normalize distance: shorter distance gives a higher normalized score.
    const distanceScore = maxDistance
      ? (maxDistance - route.distance) / maxDistance
      : 0;

    const weatherScore = route.weatherScore;

    // Combine the three criteria.
    return (
      weatherScore * weightWeather +
      timeScore * weightTime +
      distanceScore * weightDistance
    );
  }

  /**
   * Get the best route based on the scoring algorithm.
   * This method finds the route with the highest score after adding all routes.
   *
   * @returns {Object} - The best route based on the computed score.
   */
  getBestRoute() {
    if (this.routes.length === 0) {
      return null; // No routes available
    }

    // Determine the maximum values for time and distance across all routes.
    const maxTime = Math.max(...this.routes.map((r) => r.time));
    const maxDistance = Math.max(...this.routes.map((r) => r.distance));

    // Compute and attach a score for each route.
    this.routes.forEach((route) => {
      route.score = Manager.scoreRoute(route, maxTime, maxDistance);
    });

    // Sort the routes by score (highest first) and return the best route.
    const bestRoute = this.routes.sort((a, b) => a.score - b.score)[0];

    // Log the weather breakdown if it's available.
    // if (bestRoute.weatherBreakdown) {
    //   console.log("Weather Condition Breakdown:", bestRoute.weatherBreakdown);
    // } else {
    //   console.log("No weather breakdown available.");
    // }

    return bestRoute;
  }

  /**
   * Get the best routes based on a scoring algorithm.
   *
   * @param {number} count - Number of best routes to return (default is 3).
   * @returns {Array} - The top routes based on the computed score.
   */
  getTopRoutes(count = 3) {
    if (this.routes.length === 0) {
      return [];
    }

    // Determine the maximum values for time and distance across all routes.
    const maxTime = Math.max(...this.routes.map((r) => r.time));
    const maxDistance = Math.max(...this.routes.map((r) => r.distance));

    // Compute and attach a score for each route.
    this.routes.forEach((route) => {
      route.score = Manager.scoreRoute(route, maxTime, maxDistance);
    });

    // Sort the routes by score (highest first) and return the top 'count' routes.
    const sortedRoutes = this.routes.sort((a, b) => b.score - a.score);
    return sortedRoutes.slice(0, count);
  }
}

module.exports = Manager;
