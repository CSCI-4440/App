import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Button,
  Platform,
  SafeAreaView,
} from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import { TouchableOpacity } from "react-native";
import * as Location from "expo-location";


const baseUrl =
  Platform.OS === "ios"
    ? "http://129.161.136.89:3000"
    : "http://129.161.139.185:3000";

export default function Index() {
  const router = useRouter();
  const [startAddress, setStartAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const [startLat, setStartLat] = useState<number | null>(42.7284117);
  const [startLong, setStartLong] = useState<number | null>(-73.69178509999999);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLong, setDestinationLong] = useState<number | null>(null);

  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const startInputRef = useRef<any>(null);
  const destinationInputRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  const routeColors = ["blue", "green", "orange", "red", "purple"];

  const decodePolyline = (encoded: string) => {
    let points = [];
    let index = 0,
      lat = 0,
      lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

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
    if (!startLat || !startLong || !destinationLat || !destinationLong) {
      alert("Please select valid addresses before searching for routes.");
      return;
    }
    setLoading(true);
    try {
      console.log("Start Coords:", startLat, startLong);
      console.log("Destination Coords:", destinationLat, destinationLong);
      console.log("Sending request to Google Directions API...");
      const response = await axios.get(
        `http://localhost:3000/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );
      console.log("Received response from Google Directions API");
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    <SafeAreaView style={styles.safeArea}>
      {/* Map Layer */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: startLat || 42.7296,
          longitude: startLong || -73.6779,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
      {apiResponse?.routes?.map((route: any, index: number) => {
        const color = routeColors[index] || "gray";
        return (
          <React.Fragment key={index}>
            {route.waypoints && (
              <Polyline
                coordinates={route.waypoints.map((point: any) => ({
                  latitude: point.lat,
                  longitude: point.lng,
                }))}
                strokeWidth={4}
                strokeColor={color}
              />
            )}
            {route.waypoints?.length > 0 && (
              <>
                <Marker
                  coordinate={{
                    latitude: route.waypoints[0].lat,
                    longitude: route.waypoints[0].lng,
                  }}
                >
                  <Callout>
                    <Text>Route {index + 1} Start</Text>
                  </Callout>
                </Marker>
                <Marker
                  coordinate={{
                    latitude: route.waypoints[route.waypoints.length - 1].lat,
                    longitude: route.waypoints[route.waypoints.length - 1].lng,
                  }}
                >
                  <Callout>
                    <Text>Route {index + 1} End</Text>
                  </Callout>
                </Marker>
              </>
            )}
          </React.Fragment>
        );
      })}
      </MapView>

      {/* Floating UI Overlay */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.inputWrapper}>
          <LocationInput
            placeholder="Enter destination address"
            setAddress={setDestinationAddress}
            setLat={setDestinationLat}
            setLong={setDestinationLong}
            inputRef={destinationInputRef}
          />
        </View>

        <View style={styles.routeButtonRow}>
          <TouchableOpacity style={styles.button} onPress={getRoutes}>
            <Text style={styles.buttonText}>Find Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={clearOptions}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>


        {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 10 }} />}

        {apiResponse?.routes && apiResponse.routes.length > 0 && (
          <View style={styles.routesContainer}>
            {apiResponse.routes.map((route: any, index: number) => (
              <View key={index} style={styles.routeCard}>
                <Text style={styles.routeTitle}>Route {index + 1}</Text>
                <Text>Start Address: {JSON.stringify(route.startAddress)}</Text>
                <Text>Destination: {JSON.stringify(route.destinationAddress)}</Text>
                <Text>Time: {(route.durationSeconds / 60).toFixed(1)} minutes</Text>
                <Text>Distance: {(route.distanceMeters / 1000).toFixed(2)} km</Text>
                <Text>Weather Score: {route.getPrecipitationPercent ?? "N/A"}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bottom Fixed Info Card */}
      <View style={styles.fixedInfoContainer} pointerEvents="box-none">
        <View style={styles.infoCard}>
          <View style={styles.locationRow}>
            <Text style={styles.locationTitle}>Troy, NY</Text>
            <View style={styles.changeStartButton}>
              <Button
                title="Change Start"
                onPress={() => router.push("/changeStart")}
                color="#fff"
              />
            </View>
          </View>
          <Text style={styles.weatherInfo}>60° Mostly Clear</Text>
          <Text style={styles.alertTitle}>Severe Weather Alerts</Text>
          <Text style={styles.alertSubtitle}>Wind Advisory, Troy, NY</Text>
          <View style={styles.weatherAlertsButton}>
            <Button title="Weather Alerts" onPress={() => {}} color="#fff" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  overlayContainer: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  inputWrapper: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },  
  routeButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#007bff",
    borderRadius: 10,
    padding: 10,
  },
  routesContainer: {
    marginTop: 10,
  },
  routeCard: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  fixedInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingBottom: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 16,
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  weatherInfo: {
    fontSize: 16,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  changeStartButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    overflow: "hidden",
  },
  weatherAlertsButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  
});
