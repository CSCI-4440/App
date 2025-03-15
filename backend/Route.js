const fs = require("fs");

class Route {
   constructor(legs) {
      this.startAddress = legs.startLocation.latLng;
      this.destinationAddress = legs.endLocation.latLng;
      this.distanceMeters = legs.distanceMeters;
      this.durationSeconds = parseInt(legs.duration.replace("s", ""));
      this.legs = legs;
   }

   getWaypointsEveryXMeters(intervalMeters = 40233) {
      let waypoints = [];
      let accumulatedDistance = 0;
      fs.writeFile("output.txt", ``, err => {
        if (err) {
            console.error(err);
            return;
         }
      });

      for (let step of this.legs.steps) {
         let start = step.startLocation.latLng; // { lat, lng }
         let end = step.endLocation.latLng; // { lat, lng }
         let travelStr = step.localizedValues.distance.text;
         let stepDistance = 0;
         if ((travelStr.substring(travelStr.length - 3)) == (" mi")) {
            stepDistance = parseInt(travelStr.replace(" mi", "")) * 1609.34;

         }
         else if ((travelStr.substring(travelStr.length - 3)) == (" ft")) {
            stepDistance = parseInt(travelStr.replace(" ft", "")) * 0.3047992424196;
         }
         else {
            console.error("Invalid distance value");
            return;
         }

         // Distance in meters
         // how far we have come + how far the next step will take us, if thats bigger than our waypoint interval check
         while (accumulatedDistance + stepDistance >= intervalMeters) {
            let remaining = intervalMeters - accumulatedDistance;
            let ratio = remaining / stepDistance;

            // Interpolate new waypoint
            let newLat = start.latitude + ratio * (end.latitude - start.latitude);
            let newLng = start.longitude + ratio * (end.longitude - start.longitude);
            waypoints.push({ lat: newLat, lng: newLng });

            // Print waypoint
            fs.appendFile("output.txt", `Waypoint: (${newLat.toFixed(6)}, ${newLng.toFixed(6)})\n`, err => {
               if (err) {
                  console.error(err);
                  return;
               }
            });

            // Reset accumulation and shift reference point
            accumulatedDistance = 0;
            start = { latitude: newLat, longitude: newLng };
            stepDistance -= remaining;
         }

         accumulatedDistance += stepDistance;
      }
      
      return waypoints;
   }

}


module.exports = Route;

