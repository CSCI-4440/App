// // __tests__/api.test.js

// const axios = require('axios')
// jest.mock('axios')  // mock axios so no real HTTP requests are made

// // Stub out Route so none of its real implementation runs
// jest.mock('../Route', () => {
//   return jest.fn().mockImplementation(() => ({
//     getWaypointsEveryXMeters: jest.fn().mockResolvedValue(),
//     setSunsetTime:           jest.fn().mockResolvedValue(),
//     calculateWeatherScore:   jest.fn().mockResolvedValue(),
//     // properties your handler will use
//     distance:         123,
//     time:             456,
//     polyline:         'stubbedPolyline',
//     locations:        [{}, {}],
//     weatherScore:     9,
//     weatherType:      'Stub',
//     weatherBreakdown: [],
//     score:            42,
//     startDate:        new Date('2025-04-10T15:58:00.000Z'),
//     sunsetTime:       new Date('2025-04-10T20:00:00.000Z'),
//     sunriseTime:      new Date('2025-04-10T06:00:00.000Z'),
//     startAddress:     'A',
//     destinationAddress: 'B',
//   }));
// });

// // Stub out Manager so none of its real implementation runs
// jest.mock('../manager', () => {
//   return jest.fn().mockImplementation(() => {
//     const routes = []
//     return {
//       addRoute:          r => routes.push(r),
//       addRoutesDiffTime: jest.fn(),
//       getBestRoute:      () => routes[0],
//       getBestTimedRoute: () => [routes[0]],
//     }
//   });
// });

// // Now require your app after the mocks
// const request = require('supertest')
// const app     = require('../index')

// // Dummy Google API response for success cases
// const dummyGoogleApiResponse = {
//   data: {
//     routes: [
//       {
//         legs: [
//           {
//             // not used by stubs
//           }
//         ],
//         polyline: { encodedPolyline: 'dummyEncodedPolyline' }
//       }
//     ]
//   }
// }

// describe('/api/getRoutes', () => {
//   // Base query params plus settings JSON
//   const baseParams =
//     '?startLat=42.72322449049093' +
//     '&startLong=-73.6763038732019' +
//     '&destinationLat=42.6518095' +
//     '&destinationLong=-73.75447070000001' +
//     '&startTime=Thu%20Apr%2010%202025%2011:48:00%20GMT-0400' +
//     '&startDate=2025-04-20' +
//     '&googleTime=2025-04-10T15:58:00.000Z'
//   const settingsParam = `&settings=${encodeURIComponent(JSON.stringify({}))}`

//   beforeEach(() => {
//     jest.resetAllMocks()
//   })

//   test('returns 400 if any required parameter is missing', async () => {
//     // drop googleTime & settings entirely
//     const res = await request(app)
//       .get('/api/getRoutes?startLat=1&startLong=1&destinationLat=1&destinationLong=1')
//     expect(res.statusCode).toBe(400)
//     expect(res.body).toHaveProperty('error', 'Missing required parameters')
//   })

//   test('returns 200 and correct shape when all params are present', async () => {
//     axios.post.mockResolvedValue(dummyGoogleApiResponse)

//     const res = await request(app)
//       .get('/api/getRoutes' + baseParams + settingsParam)

//     expect(res.statusCode).toBe(200)
//     expect(res.body).toHaveProperty('routes')
//     expect(res.body).toHaveProperty('mapData')

//     expect(Array.isArray(res.body.routes)).toBe(true)
//     expect(res.body.routes).toHaveLength(1)

//     const route = res.body.routes[0]
//     expect(route).toMatchObject({
//       startAddress:      'A',
//       destinationAddress:'B',
//       distance:          123,
//       time:              456,
//       weatherScore:      9,
//       weatherType:       'Stub',
//       score:             42,
//       polyline:          'stubbedPolyline',
//       breakDown:         [],
//       departure:         '2025-04-10T15:58:00.000Z',
//       sunsetTime:        '2025-04-10T20:00:00.000Z',
//       sunriseTime:       '2025-04-10T06:00:00.000Z',
//     })
//   })

//   test('with NaN lat/long still returns 200 (no float validation)', async () => {
//     axios.post.mockResolvedValue(dummyGoogleApiResponse)

//     const url =
//       '/api/getRoutes?startLat=abc&startLong=xyz' +
//       '&destinationLat=1&destinationLong=1' +
//       '&startTime=now&startDate=2025-04-20' +
//       '&googleTime=2025-04-10T15:58:00.000Z' +
//       settingsParam

//     const res = await request(app).get(url)
//     expect(res.statusCode).toBe(200)
//     expect(res.body).toHaveProperty('routes')
//   })

//   test('returns 500 if the Google API call fails', async () => {
//     axios.post.mockRejectedValue(new Error('External API Error'))

//     const res = await request(app)
//       .get('/api/getRoutes' + baseParams + settingsParam)

//     expect(res.statusCode).toBe(500)
//     expect(res.body).toHaveProperty('error', 'Failed to fetch routes')
//   })
// })

const Location = require("../Location");
const axios = require("axios");

jest.mock("axios"); // 👈 Use Mock Object

describe("Location class", () => {
  const mockWeatherData = {
    data: {
      list: [
        {
          dt_txt: "2025-04-10 14:00:00",
          weather: [{ description: "sunny" }],
        },
        {
          dt_txt: "2025-04-10 15:00:00",
          weather: [{ description: "cloudy" }],
        },
      ],
    },
  };

  beforeEach(() => {
    axios.get.mockResolvedValue(mockWeatherData);
  });

  test("fetchWeather populates forecast correctly", async () => {
    const loc = new Location(40.7128, -74.006);
    await loc.fetchWeather();

    const cond1 = loc.getCondition(new Date("2025-04-10T14:10:00Z")); // rounds to 14:00
    const cond2 = loc.getCondition(new Date("2025-04-10T14:45:00Z")); // rounds to 15:00

    expect(cond1).toBe("sunny");
    expect(cond2).toBe("cloudy");
  });

  test("roundDateToNearestHour works", () => {
    const loc = new Location(0, 0);

    const d1 = new Date("2025-04-10T14:25:00Z");
    const d2 = new Date("2025-04-10T14:35:00Z");

    expect(loc.roundDateToNearestHour(d1).toISOString()).toBe("2025-04-10T14:00:00.000Z");
    expect(loc.roundDateToNearestHour(d2).toISOString()).toBe("2025-04-10T15:00:00.000Z");
  });
});

test("getCondition returns undefined if date is not in forecast", async () => {
  const loc = new Location(40.7128, -74.006);
  await loc.fetchWeather();

  const condition = loc.getCondition(new Date("2025-04-11T12:00:00Z")); // not in mocked data
  expect(condition).toBeUndefined();
});

test("clone creates a deep copy of the Location object", async () => {
  const original = new Location(1.23, 4.56);
  await original.fetchWeather();

  const clone = Location.clone(original);

  // same coordinates
  expect(clone.latitude).toBe(original.latitude);
  expect(clone.longitude).toBe(original.longitude);

  // same forecast map content
  expect(clone.forecast.size).toBe(original.forecast.size);

  // but not the same reference
  expect(clone.forecast).not.toBe(original.forecast);
});

test("fetchWeather handles API errors gracefully", async () => {
  axios.get.mockRejectedValueOnce(new Error("API down"));

  const loc = new Location(0, 0);

  const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  await loc.fetchWeather();

  expect(consoleSpy).toHaveBeenCalledWith("Error fetching weather condition:", "API down");

  consoleSpy.mockRestore();
});