/**
 * @file changeStart.js
 * @description This file contains the API endpoint for changing the start location of a route.
 * It uses the Google Directions API to compute routes and enriches them with weather information.
 * @author RINER team
 * @date 2025-04-10
 */

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Route = require("./Route");
const Manager = require("./manager");

const router = express.Router();
// API key for Google Directions API
// Ensure you have set the GOOGLE_API_KEY environment variable
const API_KEY = process.env.GOOGLE_API_KEY;

router.use(cors());
router.use(express.json());

/**
 * @route GET /api/changeStartRoutes
 * @description Computes routes based on the provided start and destination coordinates.
 * @param {number} startLat - Latitude of the starting location.
 * @param {number} startLong - Longitude of the starting location.
 * @param {number} destinationLat - Latitude of the destination location.
 * @param {number} destinationLong - Longitude of the destination location.
 * @returns {Object} - An object containing the computed routes and map data.
 * @throws {Error} - If any required parameters are missing or if the API request fails.
 */
router.get("/api/changeStartRoutes", async (req, res) => {
  console.log("Calling the Change Start API!");
  // Extract query parameters from the request
  const { startLat, startLong, destinationLat, destinationLong } = req.query;
  // Validate the required parameters
  if (!startLat || !startLong || !destinationLat || !destinationLong) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // Validate that the parameters are numbers
  const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
  // Headers for the API request
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask":
      "routes.duration,routes.distanceMeters,routes.legs,routes.polyline",
  };
  // Body of the API request
  const body = {
    origin: {
      location: {
        latLng: {
          latitude: parseFloat(startLat),
          longitude: parseFloat(startLong),
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: parseFloat(destinationLat),
          longitude: parseFloat(destinationLong),
        },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: true,
  };

  /**
   * @description Fetches routes from the Google Directions API and processes them.
   */
  try {
    // Make the API request to Google Directions API
    const response = await axios.post(url, body, { headers });
    const responseRoutes = response.data.routes;
    const routes = [];
    const mapDetails = [];

    // Check if routes are available
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
        weatherType: r.weatherType,
        score: r.score,
        sunset: r.sunsetTime,
      });
    }

    // Create a new Manager instance and get the best routes
    const manager = new Manager();
    manager.routes = routes; // Assign routes to the manager
    const bestRoutes = [manager.getBestRoute()];

    // console.log("Received this from manager: ", bestRoutes)

    /**
     * @description Format the routes for the response.
     * @param {Array} bestRoutes - Array of best routes.
     * @returns {Array} - Formatted routes.
     */
    const formattedRoutes = bestRoutes.map((r) => ({
      startAddress: r.startAddress,
      destinationAddress: r.destinationAddress,
      distance: r.distance,
      time: r.time,
      weatherScore: r.weatherScore,
      weatherType: r.weatherType,
      score: r.score,
      test: "cooked", // custom/test field
      polyline: r.polyline,
      breakDown: r.weatherBreakdown,
      sunset: r.sunsetTime,
    }));

    console.log("Formatted text: ", formattedRoutes);

    // Send the response with formatted routes and map data
    res.json({ routes: formattedRoutes, mapData: mapDetails });
  } catch (error) {
    // Handle errors from the API request
    console.error("Error fetching route data (Change Start):", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch routes" });
  }
});

module.exports = router;
