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
    this.weatherScore = 0;
    this.weatherType = null; // Will be set to the worst weather condition description
  }

  get getPolyline() {
    return this.polyline;
  }

  get getStart() {
    return this.startAddress;
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
  
  updateTime(lastLocTime, intervalMinutes)
  {
    const updated = new Date(lastLocTime); // Clone to avoid mutating original
    updated.setMinutes(updated.getMinutes() + intervalMinutes);
    return updated;
  }

  getWaypointsEveryXMeters(intervalMeters = 40233) {
    if (this.distance < intervalMeters) {
      intervalMeters = this.distance / 2;
    }

    //for converting to unix time but for now i will just use current time
    // const date = new Date('2025-04-11T10:00:00'); // Local time
    // const unixTime = Math.floor(date.getTime() / 1000);
    let lastLocTime = this.startDate;
    let intervalMinutes = (this.time / 60) / (this.distance /intervalMeters);


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

        this.locations.push(new Location(newLat, newLong));

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
  async calculateWeatherScore() {
    let maxScore = 0;
    let worstCondition = null;
    let conditionCounts = {};
    let totalValidConditions = 0;

    // Initialize an array to collect weather conditions if needed later.
    this.weatherConditions = [];

    for (let i = 0; i < this.locations.length; i++) {
      let loc = this.locations[i];
      let time = this.times[i];
      await loc.fetchWeather();
      let weatherCondition = loc.getCondition(time);
      // Here we assume the Location class sets the weather description on `loc.weatherCondition`
      if (weatherCondition) {
        const description = weatherCondition.toLowerCase();
        const score = WEATHER_SCORES[description] ?? 0;
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

    this.weatherScore = maxScore;
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
