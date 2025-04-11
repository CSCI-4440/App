/**
 * @file Location.js
 * @description This file defines the Location class, which represents a geographic location.
 * It includes methods to fetch weather data from the OpenWeather API and store it in a map.
 * @author RINER team
 * @date 2025-04-10
 * @requires axios
 * @module Location
 */

const axios = require("axios");

/**
 * @class Location
 * @description Represents a geographic location with latitude and longitude.
 * @property {number} latitude - The latitude of the location.
 * @property {number} longitude - The longitude of the location.
 * @property {Map} forecast - A map to store weather conditions for different dates.
 * @method {void} fetchWeather() - Fetches weather data from the OpenWeather API and stores it in the forecast map.
 * @method {string} getCondition(date) - Retrieves the weather condition for a given date.
 * @method {Date} roundDateToNearestHour(date) - Rounds a date to the nearest hour.
 * @static
 * @method {Location} clone(original) - Creates a deep copy of the original Location object.
 */
class Location {
  constructor(lat, long) {
    //store the latitude and longitude of the location
    this.latitude = lat;
    this.longitude = long;
    //initialize weather condition as null (to be fetched later)
    this.forecast = new Map();
  }

  /**
   * @function clone
   * @param {Location} original
   * @description Creates a deep copy of the original Location object.
   * @returns {Location}
   */
  static clone(original) {
    const newLoc = new Location(original.latitude, original.longitude);

    // Deep copy the forecast map
    newLoc.forecast = new Map(original.forecast);

    return newLoc;
  }

  /**
   * @function roundDateToNearestHour
   * @description Rounds a date to the nearest hour.
   * @param {Date} date
   * @returns {Date}
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
   * @function fetchWeather
   * @description Fetches weather data from the OpenWeather API and stores it in the forecast map.
   * @throws {Error} If the API call fails.
   */
  async fetchWeather() {
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    //construct the API request URL
    const url = `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${this.latitude}&lon=${this.longitude}&appid=${API_KEY}`;

    //construct the API request URL
    try {
      //make the API call
      const response = await axios.get(url);

      const fourcast = response.data.list;
      // console.log(response.data.city.timezone);

      for (let hour of fourcast) {
        const date = new Date(hour.dt_txt.replace(" ", "T") + "Z");
        this.forecast.set(date.toISOString(), hour.weather[0].description);
      }
    } catch (error) {
      //handle errors
      console.error("Error fetching weather condition:", error.message);
    }
  }
  /**
   * @function getCondition
   * @description Retrieves the weather condition for a given date.
   * @param {Date} date - The date for which to retrieve the weather condition.
   * @returns {string} - The weather condition for the specified date.
   */
  getCondition(date) {
    let roundedDate = this.roundDateToNearestHour(date);
    return this.forecast.get(roundedDate.toISOString());
  }
}
//export the Location class so it can be used in other files
module.exports = Location;
