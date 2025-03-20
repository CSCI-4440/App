const fs = require("fs");
const Location = require("./Location");

class Route {
   constructor(legs) {
      this.startAddress = legs.startLocation.latLng;
      this.destinationAddress = legs.endLocation.latLng;
      this.distanceMeters = legs.distanceMeters;
      this.durationSeconds = parseInt(legs.duration.replace("s", ""));
      this.polyline = legs.polyline.encodedPolyline;
      this.legs = legs;
   }

   get getPolyline() {
      return this.polyline;
   }

   async getWaypointsEveryXMeters(intervalMeters = 40233) {
      let waypoints = [];
      let accumulatedDistance = 0;
      fs.writeFileSync("output.txt", "");

      for (let step of this.legs.steps) {
         let start = step.startLocation.latLng; 
         let end = step.endLocation.latLng;     
         let travelStr = step.localizedValues.distance.text;
         let stepDistance = 0;

         if (travelStr.endsWith(" mi")) {
            stepDistance = parseFloat(travelStr.replace(" mi", "")) * 1609.34;
         } else if (travelStr.endsWith(" ft")) {
            stepDistance = parseFloat(travelStr.replace(" ft", "")) * 0.3047992424196;
         } else {
            console.error("Invalid distance value");
            return;
         }

         while (accumulatedDistance + stepDistance >= intervalMeters) {
            let remaining = intervalMeters - accumulatedDistance;
            let ratio = remaining / stepDistance;

            let newLat = start.latitude + ratio * (end.latitude - start.latitude);
            let newLong = start.longitude + ratio * (end.longitude - start.longitude);
            waypoints.push({ lat: newLat, lng: newLong });

            //fetching the weather 
            const new_location = new Location(newLat, newLong);
            await new_location.fetchWeather();
            const is_bad_weather = new_location.isBadWeather();
            const logLine = `Waypoint: (${newLat.toFixed(6)}, ${newLong.toFixed(6)}), Weather: ${new_location.weather?.conditions}, BAD WEATHER: ${is_bad_weather ? "YES" : "NO"}\n`;
            fs.appendFileSync("output.txt", logLine);
            //reset for next interval
            accumulatedDistance = 0;
            start = { latitude: newLat, longitude: newLong };
            stepDistance -= remaining;
         }
         accumulatedDistance += stepDistance;
      }
      return waypoints;
   }
}
module.exports = Route;
