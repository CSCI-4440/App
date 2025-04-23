jest.mock("axios");

jest.mock("../Location", () => {
  return class MockLocation {
    constructor(lat, long) {
      this.latitude = lat;
      this.longitude = long;
    }

    static clone(loc) {
      return new MockLocation(loc.latitude, loc.longitude);
    }

    getCondition(time) {
      return "clear sky";
    }

    async fetchWeather() {
      return; 
    }
  };
});

const axios = require("axios");
const Route = require("../Route");

describe("Route class", () => {
  const legs = {
    startLocation: { latLng: { latitude: 0, longitude: 0 } },
    endLocation: { latLng: { latitude: 1, longitude: 1 } },
    distanceMeters: 5000,
    duration: "3600",
    polyline: { encodedPolyline: "xyz" },
    steps: [
      {
        startLocation: { latLng: { latitude: 0, longitude: 0 } },
        endLocation: { latLng: { latitude: 1, longitude: 1 } },
        localizedValues: { distance: { text: "3 mi" } },
      },
    ],
  };

  const startDate = new Date("2025-04-10T12:00:00Z");

  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { sys: { sunset: 1740000000, sunrise: 1739996400 } },
    });
  });

  test("clone creates a deep copy of a route", () => {
    const original = new Route(legs, startDate);
    original.times = [new Date("2025-04-10T13:00:00Z")];
    original.weatherConditions = ["clear sky"];
    original.locations = [new (require("../Location"))(0, 0)];
    original.weatherScore = 5;
    original.weatherType = "clear sky";

    const copy = Route.clone(original);
    expect(copy).not.toBe(original);
    expect(copy.times[0].toISOString()).toBe(original.times[0].toISOString());
    expect(copy.weatherConditions).toEqual(["clear sky"]);
    expect(copy.weatherScore).toBe(5);
    expect(copy.weatherType).toBe("clear sky");
  });

  test("roundDateToNearestHour works", () => {
    const route = new Route(legs, startDate);
    const rounded1 = route.roundDateToNearestHour(new Date("2025-04-10T14:25:00Z"));
    const rounded2 = route.roundDateToNearestHour(new Date("2025-04-10T14:35:00Z"));
    expect(rounded1.toISOString()).toBe("2025-04-10T14:00:00.000Z");
    expect(rounded2.toISOString()).toBe("2025-04-10T15:00:00.000Z");
  });

  test("updateTime adds minutes correctly", () => {
    const route = new Route(legs, startDate);
    const updated = route.updateTime(new Date("2025-04-10T12:00:00Z"), 90);
    expect(updated.toISOString()).toBe("2025-04-10T13:30:00.000Z");
  });

  test("calculateWeatherScore returns correct breakdown", async () => {
    const route = new Route(legs, startDate);
    route.locations = [new (require("../Location"))(0, 0)];
    route.times = [new Date("2025-04-10T13:00:00Z")];

    const result = await route.calculateWeatherScore({}); // no filter settings
    expect(result).toEqual({ "clear sky": 100.0 });
    expect(route.weatherScore).toBe(1);
    expect(route.weatherType).toBe("clear sky");
  });

  test("fetchSunsetTime sets sunrise and sunset", async () => {
    const route = new Route(legs, startDate);
    const sunset = await route.fetchSunsetTime();

    expect(sunset instanceof Date).toBe(true);
    expect(route.sunriseTime instanceof Date).toBe(true);
  });
});