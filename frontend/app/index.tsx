import React, { useState, useRef, useEffect } from "react";
import { Button, ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import 'react-native-get-random-values';
import LocationInput from "./locationInput";
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { Platform } from "react-native";

const baseUrl = Platform.OS === "ios"
  ? "http://localhost:3000"
  : "http://10.0.2.2:3000";

export default function Index() {
  const [startAddress, setStartAddress] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLong, setStartLong] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLong, setDestinationLong] = useState<number | null>(null);

  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const startInputRef = useRef<any>(null);
  const destinationInputRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  // An array of colors for each route. 
  // If you have more than 5 routes, it'll loop around.
  const routeColors = ["blue", "green", "orange", "red", "purple"];

  // decode polyline
  const decodePolyline = (encoded: string) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  // Reset all fields and states.
  const clearOptions = () => {
    setStartAddress("");
    setDestinationAddress("");
    setStartLat(null);
    setStartLong(null);
    setDestinationLat(null);
    setDestinationLong(null);
    setApiResponse(null);
    setLoading(false);
    startInputRef.current?.clear();
    destinationInputRef.current?.clear();
  };

  const getRoutes = async () => {
    console.log("Start Address:", startAddress);
    console.log("Destination Address:", destinationAddress);

    if (!startLat || !startLong || !destinationLat || !destinationLong) {
      alert("Please select valid addresses before searching for routes.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `${baseUrl}/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );

      if (response.data.routes && response.data.routes.length > 0) {
        console.log(response.data.routes);
        console.log(response.data.routes.length, "routes found");
        console.log("Best route:", response.data.routes[0]);
        console.log("Other routes:", response.data.routes.slice(1));
      }

      // For map display
      if (response.data.mapData && response.data.mapData.length > 0) {
        setApiResponse(response.data);
      }

    } catch (error) {
      console.error("Error fetching route data api call:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fit the map to include all coordinates from the routes
  useEffect(() => {
    if (apiResponse?.mapData) {
      let allCoordinates: { latitude: number; longitude: number }[] = [];
      apiResponse.mapData.forEach((route: any) => {
        if (route.polyline) {
          const coords = decodePolyline(route.polyline);
          allCoordinates = allCoordinates.concat(coords);
        }
      });
      if (allCoordinates.length && mapRef.current) {
        mapRef.current.fitToCoordinates(allCoordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [apiResponse]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
      {/* Start Address Input */}
      <LocationInput
        key="start"
        placeholder="Enter starting address"
        setAddress={setStartAddress}
        setLat={setStartLat}
        setLong={setStartLong}
        inputRef={startInputRef}
      />

      {/* Destination Address Input */}
      <LocationInput
        key="end"
        placeholder="Enter destination address"
        setAddress={setDestinationAddress}
        setLat={setDestinationLat}
        setLong={setDestinationLong}
        inputRef={destinationInputRef}
      />

      <View style={styles.buttonWrapper}>
        <View style={styles.buttonContainer}>
          <Button title="Find Routes" onPress={getRoutes} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Clear Choices" onPress={clearOptions} />
        </View>
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <MapView
        ref={mapRef}
        style={{ height: 300, marginTop: 20 }}
        initialRegion={{
          latitude: startLat || 42.7296,
          longitude: startLong || -73.6779,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Loop through all routes */}
        {apiResponse?.mapData?.map((route: any, index: number) => {
          // pick a color from our array, or fallback to 'gray' if we run out
          const polylineColor = routeColors[index] || "gray";

          return (
            <React.Fragment key={index}>
              {/* Draw the polyline in a unique color */}
              {route.polyline && (
                <Polyline
                  coordinates={decodePolyline(route.polyline)}
                  strokeWidth={4}
                  strokeColor={polylineColor}
                />
              )}

              {/* Start Marker with a callout showing time/distance */}
              {route.start && (
                <Marker coordinate={route.start}>
                  <Callout>
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>
                        Route {index + 1} Start
                      </Text>
                      {/* If route.duration is '989s', parse if you want a nicer display */}
                      <Text>Time: {route.duration}</Text>
                      <Text>Distance: {route.distance} m</Text>
                    </View>
                  </Callout>
                </Marker>
              )}

              {/* End Marker with a callout */}
              {route.end && (
                <Marker coordinate={route.end}>
                  <Callout>
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>
                        Route {index + 1} End
                      </Text>
                      <Text>Time: {route.duration}</Text>
                      <Text>Distance: {route.distance} m</Text>
                    </View>
                  </Callout>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Display Routes Neatly in a scrollable area */}
      {apiResponse && apiResponse.routes && apiResponse.routes.length > 0 ? (
        <View style={styles.routesContainer}>
          <ScrollView style={styles.routesScroll}>
            {apiResponse.routes.map((route: any, index: number) => (
              <View key={index} style={styles.routeCard}>
                <Text style={styles.routeTitle}>Route {index + 1}</Text>
                <Text>Start Address: {JSON.stringify(route.startAddress)}</Text>
                <Text>Destination Address: {JSON.stringify(route.destinationAddress)}</Text>
                <Text>Time: {(route.durationSeconds / 60).toFixed(1)} minutes</Text>
                <Text>Distance: {(route.distanceMeters / 1000).toFixed(2)} km</Text>
                <Text>Weather Score: {route.weatherScore ?? 'N/A'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        !loading && <Text style={styles.noDataText}>No routes available</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  buttonWrapper: {
    flexDirection: "column",
    marginVertical: 10,
  },
  buttonContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  routesContainer: {
    marginTop: 20,
    // Fixed height so that the routes area is scrollable
    height: 300,
  },
  routesScroll: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  noDataText: {
    marginTop: 20,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
});