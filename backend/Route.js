/**
 * Route.js
 * @file Route.js
 * @description This file defines the Route class, which represents a route with weather conditions.
 * It includes methods to fetch weather data, calculate weather scores, and manage waypoints.
 * @author RINER team
 * @date 2025-04-10
 * @requires axios
 * @requires Location
 * @module Route
 */
const axios = require("axios");
const Location = require("./Location");

// Weather severity scale
const WEATHER_SCORES = {
  "clear sky": 1,
  "few clouds": 2,
  "scattered clouds": 3,
  "broken clouds": 4,
  "overcast clouds": 5,
  mist: 4,
  smoke: 6,
  haze: 5,
  "sand/dust whirls": 6,
  fog: 6,
  sand: 7,
  dust: 7,
  "volcanic ash": 9,
  squalls: 8,
  tornado: 10,
  "light rain": 4,
  "moderate rain": 5,
  "heavy intensity rain": 6,
  "very heavy rain": 7,
  "extreme rain": 9,
  "freezing rain": 9,
  "light intensity shower rain": 5,
  "shower rain": 6,
  "heavy intensity shower rain": 7,
  "ragged shower rain": 7,
  "light snow": 4,
  snow: 5,
  "heavy snow": 7,
  sleet: 6,
  "light shower sleet": 5,
  "shower sleet": 6,
  "light rain and snow": 5,
  "rain and snow": 6,
  "light shower snow": 5,
  "shower snow": 6,
  "heavy shower snow": 7,
  "light intensity drizzle": 3,
  drizzle: 4,
  "heavy intensity drizzle": 5,
  "light intensity drizzle rain": 4,
  "drizzle rain": 5,
  "heavy intensity drizzle rain": 6,
  "shower rain and drizzle": 6,
  "heavy shower rain and drizzle": 7,
  "shower drizzle": 5,
  "light thunderstorm": 5,
  thunderstorm: 6,
  "heavy thunderstorm": 8,
  "ragged thunderstorm": 8,
  "thunderstorm with light rain": 6,
  "thunderstorm with rain": 7,
  "thunderstorm with heavy rain": 8,
  "thunderstorm with light drizzle": 6,
  "thunderstorm with drizzle": 7,
  "thunderstorm with heavy drizzle": 8,
};

/**
 * @class Route
 * @description This class represents a route with weather conditions.
 * @property {Object}
 * @property {Object} startAddress - The starting address of the route.
 * @property {Object} destinationAddress - The destination address of the route.
 * @property {number} distance - The distance of the route in meters.
 * @property {Date} startDate - The starting date of the route.
 * @property {number} time - The estimated time of the route in seconds.
 * @property {string} polyline - The encoded polyline of the route.
 * @property {Array} legs - The legs of the route.
 * @property {Array} locations - The locations along the route.
 * @property {Array} times - The times at each location.
 * @property {Array} weatherConditions - The weather conditions at each location.
 * @property {number} weatherScore - The weather score of the route.
 * @property {string} weatherType - The worst weather condition description.
 * @property {string} sunsetTime - The sunset time at the destination.
 */
class Route {
  constructor(legs, startDate) {
    this.startAddress = legs.startLocation.latLng;
    this.destinationAddress = legs.endLocation.latLng;
    this.distance = legs.distanceMeters;
    this.startDate = startDate;
    this.time = parseInt(legs.duration.replace("s", "")); //duration
    this.polyline = legs.polyline.encodedPolyline;
    this.legs = legs;
    this.locations = [];
    this.times = [];
    this.weatherConditions = [];
    this.weatherScore = 0;
    this.weatherType = null; // Will be set to the worst weather condition description
    this.sunsetTime = null;
  }

  /**
   * @function setSunsetTime
   * @description Fetches and sets the sunset time for the destination address.
   */
  async setSunsetTime() {
    // Fetch sunset time and set it
    this.sunsetTime = await this.fetchSunsetTime();
  }

  /**
   * @function getDestination
   * @description Returns the destination address of the route.
   * @returns {Object} - The destination address.
   */
  get getDestination() {
    return this.destinationAddress;
  }

  /**
   * @function fetchSunsetTime
   * @description Fetches the sunset time from the OpenWeather API for the destination address.
   * @returns {string} - The sunset time as a formatted string.
   */
  async fetchSunsetTime() {
    // const { latitude, longitude } = this.getDestination();

    const API_KEY = process.env.OPENWEATHER_API_KEY; // Your OpenWeather API key
    // console.log("faigheigaiengangengepo")
    // console.log(this.destinationAddress.latitude)
    // console.log(this.destinationAddress.longitude)
    // console.log(API_KEY)
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.destinationAddress.latitude}&lon=${this.destinationAddress.longitude}&units=metric&appid=${API_KEY}`;

    console.log(url);
    try {
      const response = await axios.get(url);
      // console.log("API Response:", response.data.sys.sunset); // Log the whole response
      const sunsetTimestamp = response.data.sys.sunset;
      const sunsetDate = new Date(sunsetTimestamp * 1000); // Convert to milliseconds
      // console.log("SUNSET:", sunsetDate.toLocaleTimeString());
      return sunsetDate.toLocaleTimeString(); // Returns sunset time as a formatted string
    } catch (error) {
      console.error("Error fetching sunset time:", error.message);
      return null;
    }
  }

  /**
   * @function clone
   * @description Clones the current Route instance.
   * @param {Route} originalRoute
   * @returns {Route} - A new Route instance with the same properties as the original.
   * @static
   */
  static clone(originalRoute) {
    const newRoute = new Route(
      originalRoute.legs,
      new Date(originalRoute.startDate)
    );

    newRoute.startAddress = { ...originalRoute.startAddress };
    newRoute.destinationAddress = { ...originalRoute.destinationAddress };
    newRoute.distance = originalRoute.distance;
    newRoute.time = originalRoute.time;
    newRoute.polyline = originalRoute.polyline;
    newRoute.weatherScore = originalRoute.weatherScore;
    newRoute.weatherType = originalRoute.weatherType;
    newRoute.weatherBreakdown = { ...(originalRoute.weatherBreakdown || {}) };
    newRoute.times = originalRoute.times.map((t) => new Date(t));
    newRoute.locations = originalRoute.locations.map((loc) =>
      Location.clone(loc)
    );
    newRoute.weatherConditions = [...originalRoute.weatherConditions];

    return newRoute;
  }

  /**
   * @function getPolyline
   * @description Returns the polyline of the route.
   * @returns {string} - The encoded polyline of the route.
   */
  get getPolyline() {
    return this.polyline;
  }

  /**
   * @function getDistance
   * @description Returns the distance of the route.
   * @returns {number} - The distance of the route in meters.
   */
  get getStart() {
    return this.startAddress;
  }

  /**
   * @function getStartDate
   * @description Returns the start date of the route.
   * @param {Date} newDate - The new start date to set.
   * @returns {Date} - The start date of the route.
   */
  set setStartDate(newDate) {
    this.startDate = newDate;
  }

  /**
   * @function updateTimesAndConditions
   * @description Updates the times and weather conditions for each location based on the time difference in hours.
   * @param {number} timeDiffHours - The time difference in hours to update the times.
   */
  updateTimesAndConditions(timeDiffHours) {
    for (let t = 0; t < this.times.length; t++) {
      this.times[t] = this.updateTime(this.times[t], timeDiffHours * 60);
      this.weatherConditions[t] = this.locations[t].getCondition(this.times[t]);
    }
  }

  /**
   * @function roundDateToNearestHour
   * @description Rounds a date to the nearest hour.
   * @param {Date} date - The date to round.
   * @returns {Date} - The rounded date.
   */
  roundDateToNearestHour(date) {
    const rounded = new Date(date); // Clone the original date to avoid mutating it
    const minutes = rounded.getMinutes();

    if (minutes >= 30) {
      // Round up: set minutes/seconds/ms to 0 and add 1 hour
      rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
    } else {
      // Round down: just set minutes/seconds/ms to 0
      rounded.setMinutes(0, 0, 0);
    }

    return rounded;
  }

  /**
   * @function updateTime
   * @description Updates the time by adding a specified interval in minutes.
   * @param {Date} lastLocTime - The original time.
   * @param {number} intervalMinutes - The number of minutes to add.
   * @returns {Date} - The updated time.
   */
  updateTime(lastLocTime, intervalMinutes) {
    const updated = new Date(lastLocTime); // Clone to avoid mutating original
    updated.setMinutes(updated.getMinutes() + intervalMinutes);
    return updated;
  }

  /**
   * @function getWaypointsEveryXMeters
   * @description Fetches weather data for waypoints along the route at specified intervals.
   * @param {number} intervalMeters - The distance interval in meters for waypoints.
   * @returns {Promise<void>} - A promise that resolves when the waypoints are fetched.
   * @async
   */
  async getWaypointsEveryXMeters(intervalMeters = 40233) {
    if (this.distance < intervalMeters) {
      intervalMeters = this.distance / 2;
    }

    //for converting to unix time but for now i will just use current time
    // const date = new Date('2025-04-11T10:00:00'); // Local time
    // const unixTime = Math.floor(date.getTime() / 1000);
    let lastLocTime = this.startDate;
    let intervalMinutes = this.time / 60 / (this.distance / intervalMeters);

    // console.log(`DEPART  ${this.departTimeUnix}`);
    let accumulatedDistance = 0;

    for (let step of this.legs.steps) {
      let start = step.startLocation.latLng;
      let end = step.endLocation.latLng;
      let travelStr = step.localizedValues.distance.text;
      let stepDistance = 0;

      if (travelStr.endsWith(" mi")) {
        stepDistance = parseFloat(travelStr.replace(" mi", "")) * 1609.34;
      } else if (travelStr.endsWith(" ft")) {
        stepDistance = parseFloat(travelStr.replace(" ft", "")) * 0.3048;
      } else {
        console.error("Invalid distance value");
        return;
      }

      while (accumulatedDistance + stepDistance >= intervalMeters) {
        let remaining = intervalMeters - accumulatedDistance;
        let ratio = remaining / stepDistance;

        let newLat = start.latitude + ratio * (end.latitude - start.latitude);
        let newLong =
          start.longitude + ratio * (end.longitude - start.longitude);

        let timeAtLocation = this.updateTime(lastLocTime, intervalMinutes);
        lastLocTime = timeAtLocation;
        let roundedTime = this.roundDateToNearestHour(timeAtLocation);
        this.times.push(roundedTime);

        let loc = new Location(newLat, newLong);
        await loc.fetchWeather();

        this.locations.push(loc);

        // Reset for next interval
        accumulatedDistance = 0;
        start = { latitude: newLat, longitude: newLong };
        stepDistance -= remaining;
      }
      accumulatedDistance += stepDistance;
    }
  }

  /**
   * @function calculateWeatherScore
   * @description Calculates the worst (highest) weather score based on the defined severity scale.
   * Also calculates a breakdown of weather conditions.
   * Sets this.weatherScore to the maximum score and sets this.weatherType to
   * the weather condition associated with that maximum score.
   * @returns {Promise<Object>} - A promise that resolves to an object containing the weather condition percentages.
   * @async
   */
  async calculateWeatherScore() {
    await this.setSunsetTime();
    let maxScore = 0;
    let worstCondition = null;
    let conditionCounts = {};
    let totalValidConditions = 0;

    // Initialize an array to collect weather conditions if needed later.

    for (let i = 0; i < this.locations.length; i++) {
      let loc = this.locations[i];
      let time = this.times[i];
      let weatherCondition = loc.getCondition(time);
      // Here we assume the Location class sets the weather description on `loc.weatherCondition`
      if (weatherCondition) {
        const description = weatherCondition.toLowerCase();
        const score = WEATHER_SCORES[description] ?? 0;
        this.weatherConditions.push(description);

        if (score > 0) {
          conditionCounts[description] =
            (conditionCounts[description] || 0) + 1;
          totalValidConditions++;
        }

        // If this score is higher than any we've seen, update maxScore and store this condition.
        if (score > maxScore) {
          maxScore = score;
          worstCondition = description;
        }
      } else {
        console.warn("Missing weather description for location:", loc);
      }
    }

    this.weatherScore = maxScore;
    // Set weatherType to the worst weather condition (the one that produced maxScore)
    this.weatherType = worstCondition;

    // Calculate percentages for each weather condition
    const conditionPercentages = {};
    for (const [condition, count] of Object.entries(conditionCounts)) {
      conditionPercentages[condition] = parseFloat(
        ((count / totalValidConditions) * 100).toFixed(1)
      );
    }

    this.weatherBreakdown = conditionPercentages;
    return conditionPercentages;
  }
}

module.exports = Route;
