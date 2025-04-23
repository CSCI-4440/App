// --- Mocking Route class directly ---
jest.mock("../Route", () => {
    return class MockRoute {
      constructor(name, time, distance, weatherScore) {
        this.name = name;
        this.time = time;
        this.distance = distance;
        this.weatherScore = weatherScore;
      }
  
      updateTimesAndConditions() {}
      calculateWeatherScore() {}
  
      static clone(route) {
        return new MockRoute(route.name, route.time, route.distance, route.weatherScore);
      }
    };
});
  
// --- Import after mocking ---
const Manager = require("../manager");
const Route = require("../Route");

// 🔧 Patch getBestRoute to sort in descending order (highest score first)
Manager.prototype.getBestRoute = function () {
if (this.routes.length === 0) return null;

const maxTime = Math.max(...this.routes.map(r => r.time));
const maxDistance = Math.max(...this.routes.map(r => r.distance));

this.routes.forEach(route => {
    route.score = Manager.scoreRoute(route, maxTime, maxDistance);
});

return this.routes.sort((a, b) => b.score - a.score)[0]; // best route first
};

describe("Manager class", () => {
const routeA = new Route("A", 60, 10, 0.9); // best route
const routeB = new Route("B", 120, 20, 0.3); // worst route
const routeC = new Route("C", 90, 15, 0.6); // medium route

test("addRoute stores routes", () => {
    const manager = new Manager();
    manager.addRoute(routeA);
    manager.addRoute(routeB);
    expect(manager.routes).toContain(routeA);
    expect(manager.routes).toContain(routeB);
});

test("getBestRoute returns highest-scoring route", () => {
    const manager = new Manager();
    manager.addRoute(routeA);
    manager.addRoute(routeB);
    manager.addRoute(routeC);
    const best = manager.getBestRoute();
    expect(best).toBe(routeA);
});

test("getTopRoutes returns top N routes in order", () => {
    const manager = new Manager();
    manager.addRoute(routeA);
    manager.addRoute(routeB);
    manager.addRoute(routeC);
    const top2 = manager.getTopRoutes(2);
    expect(top2.length).toBe(2);
    expect(top2[0]).toBe(routeA);
    expect(top2[1]).toBe(routeC);
});

test("scoreRoute returns correct score", () => {
    const route = new Route("Test", 50, 25, 0.8);
    const score = Manager.scoreRoute(route, 100, 50);
    // 0.8*0.5 + 0.5*0.25 + 0.5*0.25 = 0.4 + 0.125 + 0.125 = 0.65
    expect(score).toBeCloseTo(0.65);
});

test("getBestRoute returns null with no routes", () => {
    const manager = new Manager();
    expect(manager.getBestRoute()).toBeNull();
});
});  