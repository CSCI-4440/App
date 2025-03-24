import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Platform
} from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const baseUrl = Platform.OS === "ios" ? "http://localhost:3000" : "http://10.0.2.2:3000";

export default function ChangeStart() {
  const router = useRouter();

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

  // Colors for drawing routes.
  const routeColors = ["blue", "green", "orange", "red", "purple"];

  // Polyline decoding function.
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
        `${baseUrl}/api/changeStartRoutes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );
      // Assume the backend returns both routes and mapData.
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching route data (Change Start):", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fit the map to include all coordinates from the routes.
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
      <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
        {/* Top Row: Back Button (outside the search container) and Starting Address Search */}
        <View style={styles.topRowContainer}>
          <View style={styles.backButtonContainer}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#007bff"
              onPress={() => router.back()}
            />
          </View>
          <View style={styles.searchBarContainer}>
            <LocationInput
              key="start"
              placeholder="Enter starting address"
              setAddress={setStartAddress}
              setLat={setStartLat}
              setLong={setStartLong}
              inputRef={startInputRef}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Destination Address Input */}
        <View style={styles.searchBarContainer}>
          <LocationInput
            key="end"
            placeholder="Enter destination address"
            setAddress={setDestinationAddress}
            setLat={setDestinationLat}
            setLong={setDestinationLong}
            inputRef={destinationInputRef}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.routeButtonRow}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Button title="Find Routes" onPress={getRoutes} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Button title="Clear Choices" onPress={clearOptions} color="#fff" />
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
          {apiResponse?.mapData?.map((route: any, index: number) => {
            const polylineColor = routeColors[index] || "gray";
            return (
              <React.Fragment key={index}>
                {route.polyline && (
                  <Polyline
                    coordinates={decodePolyline(route.polyline)}
                    strokeWidth={4}
                    strokeColor={polylineColor}
                  />
                )}
                {route.start && (
                  <Marker coordinate={route.start}>
                    <Callout>
                      <View>
                        <Text style={{ fontWeight: "bold" }}>
                          Route {index + 1} Start
                        </Text>
                        <Text>Time: {route.duration}</Text>
                        <Text>Distance: {route.distance} m</Text>
                      </View>
                    </Callout>
                  </Marker>
                )}
                {route.end && (
                  <Marker coordinate={route.end}>
                    <Callout>
                      <View>
                        <Text style={{ fontWeight: "bold" }}>
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

        {apiResponse && apiResponse.routes && apiResponse.routes.length > 0 ? (
          <View style={styles.routesContainer}>
            <ScrollView style={styles.routesScroll}>
              {apiResponse.routes.map((route: any, index: number) => (
                <View key={index} style={styles.routeCard}>
                  <Text style={styles.routeTitle}>Route {index + 1}</Text>
                  <Text>Start Address: {JSON.stringify(route.startAddress)}</Text>
                  <Text>
                    Destination Address:{" "}
                    {JSON.stringify(route.destinationAddress)}
                  </Text>
                  <Text>
                    Time: {(route.durationSeconds / 60).toFixed(1)} minutes
                  </Text>
                  <Text>
                    Distance: {(route.distanceMeters / 1000).toFixed(2)} km
                  </Text>
                  <Text>
                    Weather Score: {route.weatherScore ?? "N/A"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          !loading && <Text style={styles.noDataText}>No routes available</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  topRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    marginBottom: 10,
  },
  backButtonContainer: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
  },
  routeButtonRow: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 12,
    width: "90%",
    alignSelf: "center",
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
