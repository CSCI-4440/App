const axios = require("axios"); 

//define the Location class to represent a geographic location
class Location {
    constructor(lat, long) {
        //store the latitude and longitude of the location
        this.latitude = lat;
        this.longitude = long;
        //initialize weather condition as null (to be fetched later)
        this.forecast = new Map();
    }

    static clone(original) {
        const newLoc = new Location(original.latitude, original.longitude);
    
        // Deep copy the forecast map
        newLoc.forecast = new Map(original.forecast);
    
        return newLoc;
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
      
    //fetch the current weather condition from the OpenWeather API
    async fetchWeather() {
        const API_KEY = process.env.OPENWEATHER_API_KEY; 


    //construct the API request URL
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&units=metric&appid=${API_KEY}`;
    try {
      //make the API call
      const response = await axios.get(url);

      //extract and store the weather condition description
      this.weatherCondition = response.data.weather[0].description;
      //log the result
      console.log(
        `Weather condition at (${this.latitude}, ${this.longitude}): ${this.weatherCondition}`
      );
    } catch (error) {
      //handle errors
      console.error("Error fetching weather condition:", error.message);
    }
  }
  //getter method to retrieve the stored weather condition
  getCondition() {
    return this.weatherCondition;
  }
}
//export the Location class so it can be used in other files
module.exports = Location;
