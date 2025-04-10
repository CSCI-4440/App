require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require("cors");
const Route = require("./Route");
const Manager = require("./manager")

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GOOGLE_API_KEY



app.use(cors());

app.use(express.json());

app.get("/api/getRoutes", async (req, res) => {
    console.log("Calling the Change Start API!");
    const { startLat, startLong, destinationLat, destinationLong, startTime, startDate, googleTime } = req.query;

    if (!startLat || !startLong || !destinationLat || !destinationLong || !googleTime || !startTime || !startDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const dateObject = new Date(googleTime);
    console.log("This is the current time:", dateObject);
   
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const headers = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs,routes.polyline"
    };

    const body = {
      origin: { location: { latLng: { latitude: parseFloat(startLat), longitude: parseFloat(startLong) } } },
      destination: { location: { latLng: { latitude: parseFloat(destinationLat), longitude: parseFloat(destinationLong) } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: true,
      departureTime: googleTime
    };

  
    try {
      console.log("Making Google API Call");
      
      const response = await axios.post(url, body, { headers });
      console.log("Google API Call finished");
      const responseRoutes = response.data.routes;
      const routes = [];
      const mapDetails = [];
      const manager = new Manager();
      
      for (const route of responseRoutes) {
        const legs = route.legs[0];
        console.log("Added a route:");
        const r = new Route(legs, dateObject);
        
        // Set polyline directly
        r.polyline = route.polyline.encodedPolyline;
        
        // Enrich with weather scoring
        await r.getWaypointsEveryXMeters();
        await r.setSunsetTime();

        try {
          await r.calculateWeatherScore();
        } catch (error) {
          console.log(error)
        }
        
  
        // Push Route instance to scoring system
        routes.push(r);
        manager.addRoute(r);

  
        // Optional map data details
        mapDetails.push({
          distance: r.distance,
          duration: r.time,
          polyline: r.polyline,
          start: r.locations[0],
          end: r.locations[r.locations.length - 1],
          weatherScore: r.weatherScore,
          weatherType: r.weatherType,
          weatherBreakdown: r.weatherBreakdown,
          score: r.score,
          departure: r.startDate.toISOString(),
          sunsetTime: r.sunsetTime
        });
      }
      
    
      let bestRoutes = [manager.getBestRoute()];
      // console.log("OG Routes:", bestRoutes);
      

      manager.addRoutesDiffTime();
      const bestTimedRoute = manager.getBestTimedRoute()[0];
      console.log(bestTimedRoute.weatherBreakdown);

      mapDetails.push({
        distance: bestTimedRoute.distance,
        duration: bestTimedRoute.time,
        polyline: bestTimedRoute.polyline,
        start: bestTimedRoute.locations[0],
        end: bestTimedRoute.locations[bestTimedRoute.locations.length - 1],
        weatherScore: bestTimedRoute.weatherScore,
        weatherType: bestTimedRoute.weatherType,
        weatherBreakdown: bestTimedRoute.weatherBreakdown,
        score: bestTimedRoute.score,
        departure: bestTimedRoute.startDate.toISOString(),
        sunsetTime: bestTimedRoute.sunsetTime
      });
      bestRoutes.push(bestTimedRoute);
      
      
      const formattedRoutes = bestRoutes.map(r => ({
          startAddress: r.startAddress,
          destinationAddress: r.destinationAddress,
          distance: r.distance,
          time: r.time,
          weatherScore: r.weatherScore,
          weatherType: r.weatherType,
          score: r.score,
          polyline: r.polyline,
          breakDown: r.weatherBreakdown,
          departure: r.startDate.toISOString(),
          sunsetTime: r.sunsetTime
        }));

        // console.log(formattedRoutes.length);
        // console.log("Formatted:", formattedRoutes);
  
      res.json({ routes: formattedRoutes, mapData: mapDetails });
    } catch (error) {
      // console.error("Error fetching route data (Change Start):", error.response.data , error.response.status, error.response.request, error.request.stack);
      res.status(error.response?.status || 500).json({ error: "Failed to fetch routes" });
    }
});


app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
