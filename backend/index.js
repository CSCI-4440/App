require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GOOGLE_API_KEY

app.use(express.json());

/* Input start and end coordinates, returns multiple routes */
app.post("/api/routes", async (req, res) => {

    console.log(API_KEY)

    const { startLat, startLong, destinationLat, destinationLong } = req.body;

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
        "origin": { "location": { "latLng": { "latitude": startLat, "longitude": startLong } } },
        "destination": { "location": { "latLng": { "latitude": destinationLat, "longitude": destinationLong } } },
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "computeAlternativeRoutes": true
    };

    try {
        const response = await axios.post(url, body, { headers });
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching route data:", error.message);
        res.status(error.response?.status || 500).json({ error: "Failed to fetch routes" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});