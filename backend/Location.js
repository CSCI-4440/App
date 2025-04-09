const axios = require("axios"); 

//define the Location class to represent a geographic location
class Location {
    constructor(lat, long) {
        //store the latitude and longitude of the location
        this.latitude = lat;
        this.longitude = long;
        //initialize weather condition as null (to be fetched later)
        this.weatherCondition = null;
    }
    //fetch the current weather condition from the OpenWeather API
    async fetchWeather() {
        console.log("Fetching weather condition...");
        const API_KEY = process.env.OPENWEATHER_API_KEY; 
        //construct the API request URL
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&units=metric&appid=${API_KEY}`;
        try {
            //make the API call
            const response = await axios.get(url);
            //extract and store the weather condition description 
            this.weatherCondition = response.data.weather[0].description;
            //log the result
            console.log(`Weather condition at (${this.latitude}, ${this.longitude}): ${this.weatherCondition}`);
        } catch (error) {
            //handle errors
            console.error("Error fetching weather condition:", error.message);
        }
    }
    //getter method to retrieve the stored weather condition
    getCondition() 
    {
        return this.weatherCondition;
    }
}
//export the Location class so it can be used in other files
module.exports = Location;
