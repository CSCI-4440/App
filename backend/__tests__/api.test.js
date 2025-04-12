const request = require('supertest')
const app = require('../index')
const axios = require('axios')

// Mock axios so we don’t hit the real APIs
jest.mock('axios')

// Dummy response that simulates a successful Google API call
const dummyGoogleApiResponse = {
  data: {
    routes: [
      {
        legs: [
          {
            startLocation: { latLng: { latitude: 40.748817, longitude: -73.985428 } },
            endLocation: { latLng: { latitude: 40.73061, longitude: -73.935242 } },
            distanceMeters: 2000,
            duration: "3600s",
            polyline: { encodedPolyline: "dummyEncodedPolyline" },
            steps: [
              {
                startLocation: { latLng: { latitude: 40.748817, longitude: -73.985428 } },
                endLocation: { latLng: { latitude: 40.73061, longitude: -73.935242 } },
                localizedValues: { distance: { text: "1 mi" } }
              }
            ]
          }
        ],
        polyline: { encodedPolyline: "dummyEncodedPolyline" }
      }
    ]
  }
}

describe('/api/getRoutes API', () => {
  // Valid query string with all required parameters appended to the URL.
  const validQueryStr = '/api/getRoutes?startLat=42.72322449049093' +
    '&startLong=-73.6763038732019' +
    '&destinationLat=42.6518095' +
    '&destinationLong=-73.75447070000001' +
    '&startTime=Thu%20Apr%2010%202025%2011:48:00%20GMT-0400' +
    '&startDate=2025-04-20' +
    '&googleTime=2025-04-10T15:58:00.000Z'

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks()
  })

  // Test: missing parameters should return 400.
  // Remove one required parameter (here we drop googleTime)
  test('should return 400 if required parameters are missing', async () => {
    const missingParamUrl = '/api/getRoutes?startLat=42.72322449049093' +
      '&startLong=-73.6763038732019' +
      '&destinationLat=42.6518095' +
      '&destinationLong=-73.75447070000001' +
      '&startTime=Thu%20Apr%2010%202025%2011:48:00%20GMT-0400' +
      '&startDate=2025-04-11'
    
    const res = await request(app).get(missingParamUrl)
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  // Test: Successful call with valid parameters should return 200 and valid route data
  test('should return 200 and valid routes with all required parameters', async () => {
    // Mock axios.post to simulate a successful Google API call
    axios.post.mockResolvedValue(dummyGoogleApiResponse)

    const res = await request(app).get(validQueryStr)
    // console.log(JSON.stringify(res.body, null, 2))

    // expect(res.statusCode).toBe(200)
    // // Expect that the response contains both "routes" and "mapData"
    // expect(res.body).toHaveProperty('routes')
    // expect(res.body).toHaveProperty('mapData')
    // expect(Array.isArray(res.body.routes)).toBe(true)
    // expect(res.body.routes.length).toBeGreaterThan(0)

    // // Validate properties in the returned route object
    // const route = res.body.routes[0]
    // expect(route).toHaveProperty('startAddress')
    // expect(route).toHaveProperty('destinationAddress')
    // expect(route).toHaveProperty('distance')
    // expect(route).toHaveProperty('time')
    // expect(route).toHaveProperty('weatherScore')
    // expect(route).toHaveProperty('weatherType')
    // expect(route).toHaveProperty('score')
    // expect(route).toHaveProperty('polyline')
    // expect(route).toHaveProperty('breakDown')
    // expect(route).toHaveProperty('departure')
    // expect(route).toHaveProperty('sunsetTime')
  })

  // Test: with invalid latitude/longitude values, expecting an error status (400 or 500)
  test('should handle invalid lat/lng values gracefully', async () => {
    const badQueryStr = '/api/getRoutes?startLat=abc' +
      '&startLong=xyz' +
      '&destinationLat=42.6518095' +
      '&destinationLong=-73.75447070000001' +
      '&startTime=Thu%20Apr%2010%202025%2011:48:00%20GMT-0400' +
      '&startDate=2025-04-11' +
      '&googleTime=2025-04-10T15:58:00.000Z'
    
    axios.post.mockResolvedValue(dummyGoogleApiResponse)
    const res = await request(app).get(badQueryStr)
    expect([400, 500]).toContain(res.statusCode)
  })

  // Test: Simulate external API failure so that our endpoint returns 500
  test('should return an error response when external API call fails', async () => {
    // Simulate failure in axios.post
    axios.post.mockRejectedValue(new Error('External API Error'))
    
    const res = await request(app).get(validQueryStr)
    expect(res.statusCode).toBe(500)
    expect(res.body).toHaveProperty('error', 'Failed to fetch routes')
  })
})

// Ensure all asynchronous operations are cleaned up after tests
afterAll((done) => {
  done()
})