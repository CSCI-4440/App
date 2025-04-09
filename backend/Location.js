const axios = require("axios"); 

//define the Location class to represent a geographic location
class Location {
    constructor(lat, long, time) {
        //store the latitude and longitude of the location
        this.latitude = lat;
        this.longitude = long;
        //initialize weather condition as null (to be fetched later)
        this.time = time;
        this.weatherCondition = null;
        this.isDay = true;
    }
    //fetch the current weather condition from the OpenWeather API
    async fetchWeather() {
        console.log("Fetching weather condition...");
        const API_KEY = process.env.OPENWEATHER_API_KEY; 


        // console.log("Fetching weather condition...");
        // const API_KEY = process.env.OPENWEATHER_API_KEY; 
        
        // console.log(`OLD time ${this.time}`);
        // this.time = 1744199321;
        // console.log(`NEW time ${this.time}`);

        //construct the API request URL
        const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${this.latitude}&lon=${this.longitude}&dt=${this.time}&appid=${API_KEY}`;
        const { dt, sunrise, sunset } = response.data.current;
        this.isDay = dt >= sunrise && dt < sunset;

        console.log(`IS DAYTIME: ${this.isDay}`);

        //construct the API request URL
        // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&units=metric&appid=${API_KEY}`;
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