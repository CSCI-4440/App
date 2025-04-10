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
    //getter method to retrieve the stored weather condition
    getCondition(date) 
    {
        let roundedDate = this.roundDateToNearestHour(date);
        return this.forecast.get(roundedDate.toISOString());
    }
}
//export the Location class so it can be used in other files
module.exports = Location;