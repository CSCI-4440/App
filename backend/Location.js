const fs = require("fs");
const axios = require("axios");

class Location 
{
    constructor(lat, long) 
    {
        this.latitude = lat;
        this.longitude = long;
        this.weather = null;
    }

    async fetchWeather() 
    {
        console.log("Fetching weather data..."); 
        const API_KEY = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&units=metric&appid=${API_KEY}`;
        try 
        {
            const response = await axios.get(url);
            this.weather = 
            {
                    temperature: response.data.main.temp,
                    conditions: response.data.weather[0].description,
                    weatherId: response.data.weather[0].id,
                    windSpeed: response.data.wind.speed,
                    visibility: response.data.visibility || null,
            };
            console.log(`Weather at (${this.latitude}, ${this.longitude}):`, this.weather);
        } 
        catch (error) 
        {
            console.error("Error fetching weather data:", error.message);
        }
    }

    isBadWeather() {
        if (!this.weather) 
            return false;
        const { conditions, temperature, windSpeed, visibility, weatherId } = this.weather;
        const badConditions = ["rain", "snow", "thunderstorm", "fog", "drizzle"];
        const isBadCondition = badConditions.some(cond => conditions.toLowerCase().includes(cond));
        const lowVisibility = visibility && visibility < 1000;
        const highWinds = windSpeed > 10; 
        const cold = temperature < 0 || temperature > 35;
        return isBadCondition || lowVisibility || highWinds || cold;
    }
}

module.exports = Location;
