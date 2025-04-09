require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require("cors");
const Route = require("./Route");
const Manager = require("./manager");

const router = express.Router();
const API_KEY = process.env.GOOGLE_API_KEY;

router.use(cors());
router.use(express.json());

router.get("/api/changeStartRoutes", async (req, res) => {
  console.log("Calling the Change Start API!");
  const { startLat, startLong, destinationLat, destinationLong } = req.query;
  if (!startLat || !startLong || !destinationLat || !destinationLong) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

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
    computeAlternativeRoutes: true
  };

  try {
    const response = await axios.post(url, body, { headers });

    const responseRoutes = response.data.routes;
    const routes = [];
    const mapDetails = [];

    for (const route of responseRoutes) {
      const legs = route.legs[0];
      const r = new Route(legs);

      // Set polyline directly
      r.polyline = route.polyline.encodedPolyline;

      // Enrich with weather scoring
      r.getWaypointsEveryXMeters();
      await r.calculateWeatherScore();

      // Push Route instance to scoring system
      routes.push(r);

      // Optional map data details
      mapDetails.push({
        distance: r.distance,
        duration: r.time,
        polyline: r.polyline,
        start: r.locations[0],
        end: r.locations[r.locations.length - 1],
        weatherScore: r.weatherScore,
        score: r.score
      });
    }

    const manager = new Manager();
    manager.routes = routes; // Assign routes to the manager
    const bestRoutes = manager.getBestRoute();

    // Format the best routes to send to frontend
    const formattedRoutes = bestRoutes.map(r => ({
      startAddress: r.startAddress,
      destinationAddress: r.destinationAddress,
      distance: r.distance,
      time: r.time,
      weatherScore: r.weatherScore,
      score: r.score,
      polyline: r.polyline
    }));

    res.json({ routes: formattedRoutes, mapData: mapDetails });
  } catch (error) {
    console.error("Error fetching route data (Change Start):", error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch routes" });
  }
});

module.exports = router;
