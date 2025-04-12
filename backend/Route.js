const axios = require("axios");
const Location = require("./Location");

// Weather severity scale
const WEATHER_SCORES = {
  "clear sky": 1,
  "few clouds": 2,
  "scattered clouds": 3,
  "broken clouds": 4,
  "overcast clouds": 5,
  "mist": 4,
  "smoke": 6,
  "haze": 5,
  "sand/dust whirls": 6,
  "fog": 6,
  "sand": 7,
  "dust": 7,
  "volcanic ash": 9,
  "squalls": 8,
  "tornado": 10,
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
  "snow": 5,
  "heavy snow": 7,
  "sleet": 6,
  "light shower sleet": 5,
  "shower sleet": 6,
  "light rain and snow": 5,
  "rain and snow": 6,
  "light shower snow": 5,
  "shower snow": 6,
  "heavy shower snow": 7,
  "light intensity drizzle": 3,
  "drizzle": 4,
  "heavy intensity drizzle": 5,
  "light intensity drizzle rain": 4,
  "drizzle rain": 5,
  "heavy intensity drizzle rain": 6,
  "shower rain and drizzle": 6,
  "heavy shower rain and drizzle": 7,
  "shower drizzle": 5,
  "light thunderstorm": 5,
  "thunderstorm": 6,
  "heavy thunderstorm": 8,
  "ragged thunderstorm": 8,
  "thunderstorm with light rain": 6,
  "thunderstorm with rain": 7,
  "thunderstorm with heavy rain": 8,
  "thunderstorm with light drizzle": 6,
  "thunderstorm with drizzle": 7,
  "thunderstorm with heavy drizzle": 8
};

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
    this.sunriseTime = null;
  }

  async setSunsetTime() {
    // Fetch sunset time and set it
    this.sunsetTime = await this.fetchSunsetTime();  
  }

  get getDestination() {
    return this.destinationAddress;
  }

  async fetchSunsetTime() {
    // const { latitude, longitude } = this.getDestination();

    const API_KEY = process.env.OPENWEATHER_API_KEY; // Your OpenWeather API key
    // console.log("faigheigaiengangengepo")
    // console.log(this.destinationAddress.latitude)
    // console.log(this.destinationAddress.longitude)
    // console.log(API_KEY)
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.destinationAddress.latitude}&lon=${this.destinationAddress.longitude}&units=metric&appid=${API_KEY}`;
    try {

      const response = await axios.get(url);
      // console.log("API Response:", response.data.sys.sunset); // Log the whole response
      const sunsetTimestamp = response.data.sys.sunset;
      const sunriseTimestamp = response.data.sys.sunrise;
      const sunsetDate = new Date(sunsetTimestamp * 1000);
      const sunriseDate = new Date(sunriseTimestamp * 1000); // Convert to milliseconds)
      this.sunriseTime = sunriseDate;
      
      return sunsetDate  // Returns sunset time as a formatted string
    } catch (error) {
      console.error("Error fetching sunset time:", error.message);
      return null;
    }
  }


  static clone(originalRoute) {
    const newRoute = new Route(originalRoute.legs, new Date(originalRoute.startDate));

    newRoute.startAddress = { ...originalRoute.startAddress };
    newRoute.destinationAddress = { ...originalRoute.destinationAddress };
    newRoute.distance = originalRoute.distance;
    newRoute.time = originalRoute.time;
    newRoute.polyline = originalRoute.polyline;
    newRoute.weatherScore = originalRoute.weatherScore;
    newRoute.weatherType = originalRoute.weatherType;
    newRoute.weatherBreakdown = { ...(originalRoute.weatherBreakdown || {}) };
    newRoute.times = originalRoute.times.map(t => new Date(t));
    newRoute.locations = originalRoute.locations.map(loc => Location.clone(loc));
    newRoute.weatherConditions = [...originalRoute.weatherConditions];
    newRoute.sunriseTime = originalRoute.sunriseTime;
    newRoute.sunsetTime = originalRoute.sunsetTime;

    return newRoute;
  }

  get getPolyline() {
    return this.polyline;
  }

  get getStart() {
    return this.startAddress;
  }


  set setStartDate(newDate) {
    this.startDate = newDate;
  }

  updateTimesAndConditions(timeDiffHours) {
    for (let t = 0; t < this.times.length; t++) {
      this.times[t] = this.updateTime(this.times[t], timeDiffHours * 60);
      this.weatherConditions[t] = this.locations[t].getCondition(this.times[t]);
    }
  }


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

  updateTime(lastLocTime, intervalMinutes) {
    const updated = new Date(lastLocTime); // Clone to avoid mutating original
    updated.setMinutes(updated.getMinutes() + intervalMinutes);
    return updated;
  }

  async getWaypointsEveryXMeters(intervalMeters = 40233) {
    if (this.distance < intervalMeters) {
      intervalMeters = this.distance / 2;
    }

    //for converting to unix time but for now i will just use current time
    // const date = new Date('2025-04-11T10:00:00'); // Local time
    // const unixTime = Math.floor(date.getTime() / 1000);
    let lastLocTime = this.startDate;
    let intervalMinutes = (this.time / 60) / (this.distance / intervalMeters);


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
        let newLong = start.longitude + ratio * (end.longitude - start.longitude);

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
   * Calculates the worst (highest) weather score based on the defined severity scale.
   * Also calculates a breakdown of weather conditions.
   * Sets this.weatherScore to the maximum score and sets this.weatherType to 
   * the weather condition associated with that maximum score.
   */
  async calculateWeatherScore(settings) {
    await this.setSunsetTime();
    let worstCondition = null;
    let conditionCounts = {};
    let maxScore = 0;
    let totalValidConditions = 0;

    // Initialize an array to collect weather conditions if needed later.

    for (let i = 0; i < this.locations.length; i++) {
      let loc = this.locations[i];
      let time = this.times[i];
      let weatherCondition = loc.getCondition(time);
      // Here we assume the Location class sets the weather description on `loc.weatherCondition`
      if (weatherCondition) {
        let multiplier = 1;
        for (const [key, value] of Object.entries(settings)) {
          if (!value && description.toLowerCase().includes(key)) {
            multipler = 0.1;
          }
        }

        const description = weatherCondition.toLowerCase();
        const score = (multiplier * WEATHER_SCORES[description]) ?? 0;
        this.weatherScore += (multiplier * WEATHER_SCORES[description]) ?? 0;
        this.weatherConditions.push(description);

        if (score > 0) {
          conditionCounts[description] = (conditionCounts[description] || 0) + 1;
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

    // Set weatherType to the worst weather condition (the one that produced maxScore)
    this.weatherType = worstCondition;

    // Calculate percentages for each weather condition
    const conditionPercentages = {};
    for (const [condition, count] of Object.entries(conditionCounts)) {
      conditionPercentages[condition] = parseFloat(((count / totalValidConditions) * 100).toFixed(1));
    }

    this.weatherBreakdown = conditionPercentages;
    return conditionPercentages;
  }
}


// getPercentAfterSunset()
// {
//   for (let lo)
// }

module.exports = Route;
