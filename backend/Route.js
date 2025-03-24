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
      this.locations = [];
      this.weather = [];
   }

   get getPolyline() {
      return this.polyline;
   }

   get getStart() {
      return this.startAddress;
   }

   async getPrecipitationPercent() {
      let bad = 0;
      for (let loc of this.locations){
         await loc.fetchWeather();
         const is_bad_weather = loc.isBadWeather();
         if (is_bad_weather) {
            bad += 1;
         }
      }

      return bad / this.locations.length;
   }

   getWaypointsEveryXMeters(intervalMeters = 40233) {
      if (this.distanceMeters < intervalMeters)
      {
         intervalMeters = this.distanceMeters / 2;
      }
      let accumulatedDistance = 0;

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
            this.locations.push(new Location(newLat, newLong));


            //reset for next interval
            accumulatedDistance = 0;
            start = { latitude: newLat, longitude: newLong };
            stepDistance -= remaining;
         }
         accumulatedDistance += stepDistance;
      }
   }
}
module.exports = Route;
