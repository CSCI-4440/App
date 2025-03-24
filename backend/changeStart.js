// changeStart.js
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
    "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs"
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

    // Build map details
    let routeDetails = [];
    for (const route of response.data.routes) {
      for (const leg of route.legs) {
        routeDetails.push({
          distance: leg.distanceMeters,
          duration: leg.duration,
          polyline: leg.polyline.encodedPolyline,
          start: leg.startLocation.latLng,
          end: leg.endLocation.latLng,
        });
      }
    }
    console.log(routeDetails);

    const routes = [];
    const responseRoutes = response.data.routes;
    for (const route of responseRoutes) {
      const legs = route.legs[0];
      const r = new Route(legs);
      const waypoints = await r.getWaypointsEveryXMeters();
      routes.push({
        startAddress: r.startAddress,
        destinationAddress: r.destinationAddress,
        distanceMeters: r.distanceMeters,
        durationSeconds: r.durationSeconds,
        waypoints: waypoints
      });
    }
    const bestRoutes = Manager.getBestRoutes(routes);
    res.json({ routes: bestRoutes, mapData: routeDetails });
  } catch (error) {
    console.error("Error fetching route data (Change Start):", error.message);
    res.status(error.response?.status || 500).json({ error: "Failed to fetch routes" });
  }
});

module.exports = router;
