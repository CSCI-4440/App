require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require("cors");
const Route = require("./Route");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GOOGLE_API_KEY

app.use(cors());

app.use(express.json());

app.get("/test", async (req, res) => {
    res.send("hello");
})

app.get("/api/routes", async (req, res) => {
    console.log("Calling the API!");
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
        const routes = [];
        const responseRoutes = response.data.routes;
        for (const route of responseRoutes) 
        {
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
        res.json({ routes });
    } catch (error) {
        console.error("Error fetching route data:", error.message);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch routes" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});