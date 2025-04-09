const request = require("supertest");
const app = require("../index");
const axios = require("axios");

// Mock axios
jest.mock("axios");

// Optionally mock Route class if it relies on external APIs or files
jest.mock("../Route", () => {
  return jest.fn().mockImplementation(() => ({
    getWaypointsEveryXMeters: jest.fn(() => Promise.resolve(["pointA", "pointB"])),
    startAddress: "Start Location",
    destinationAddress: "End Location",
    distanceMeters: 1000,
    durationSeconds: 600
  }));
});

describe("GET /test", () => {
  it("should return 'hello'", async () => {
    const res = await request(app).get("/test");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("hello");
  });
});

describe("GET /api/routes", () => {
  it("should return processed route data", async () => {
    // Mock Google API response
    axios.post.mockResolvedValue({
      data: {
        routes: [
          {
            legs: [
              {
                distanceMeters: 1000,
                duration: { seconds: 600 },
                startAddress: "Start Location",
                endAddress: "End Location",
                steps: []
              }
            ]
          }
        ]
      }
    });

    const res = await request(app).get("/api/routes").query({
      startLat: 40.748817,
      startLong: -73.985428,
      destinationLat: 40.73061,
      destinationLong: -73.935242
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.routes[0]).toEqual(expect.objectContaining({
      startAddress: expect.any(String),
      destinationAddress: expect.any(String),
      distanceMeters: expect.any(Number),
      durationSeconds: expect.any(Number),
      waypoints: expect.any(Array)
    }));
  });

  it("should return 400 if query params are missing", async () => {
    const res = await request(app).get("/api/routes");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Missing required parameters");
  });
});