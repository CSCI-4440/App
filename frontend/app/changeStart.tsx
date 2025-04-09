import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Platform,
  Alert
} from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import Config from "../config";

const baseUrl = Platform.OS === "ios" ? "http://129.161.77.35:3000" : "http://129.161.77.35:3000";

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

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Enable location permissions to continue.");
      return false;
    }
    return true;
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;
  
    const position = await Location.getCurrentPositionAsync({});
    setStartLat(position.coords.latitude);
    setStartLong(position.coords.longitude);
  
    console.log("Coordinates:", position.coords.latitude, position.coords.longitude);
    
    console.log("Google API called");
    await reverseGeocode(position.coords.latitude, position.coords.longitude);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Config.GOOGLE_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        console.log(data.results[0].formatted_address)
        setStartAddress(data.results[0].formatted_address);
      } else {
        Alert.alert("Error", "Failed to get address");
      }
    } catch (error) {
      console.error("Geocoding Error:", error);
      Alert.alert("Error", "Failed to fetch address");
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

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

      console.log("data::::: ")
      console.log(apiResponse)

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
              header="Enter starting address"
              placeholder={startAddress || "Enter starting address"}
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
            header="Enter destination address"
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

        {apiResponse && apiResponse.mapData && apiResponse.mapData.length > 0 ? (
  <View style={styles.routesContainer}>
    <ScrollView style={styles.routesScroll}>
      {apiResponse.mapData.map((route: any, index: number) => {
        const hours = Math.floor(route.duration / 3600);
        const minutes = Math.floor((route.duration % 3600) / 60);

        let weatherClass = '';
        const weatherScore = 100 - Math.round(route.weatherScore * 100);
        if (weatherScore >= 90) {
          weatherClass = 'Great';
        } else if (weatherScore >= 70) {
          weatherClass = 'Good';
        } else if (weatherScore >= 50) {
          weatherClass = 'Fair';
        } else if (weatherScore >= 30) {
          weatherClass = 'Poor';
        } else {
          weatherClass = 'Terrible';
        }

        return (
          <View key={index} style={styles.routeCard}>
            <Text style={styles.routeTitle}>
              {routeColors[index % routeColors.length].charAt(0).toUpperCase() + routeColors[index % routeColors.length].slice(1)} Route
            </Text>
            {/* <Text>Start: {route.startAddress}</Text>
            <Text>Destination: {route.destinationAddress}</Text>
            <Text>
              Time: {hours > 0 ? `${hours} hrs ${minutes} min` : `${minutes} min`}
            </Text>
            <Text>Distance: {(route.distance / 1609).toFixed(2)} mi</Text>
            <Text>Weather Type: {route.weatherType}</Text>
            <Text>Weather Score: {route.weatherScore} / 5</Text> */}

            <Text>
              {JSON.stringify(route, (key, value) => {
                // Ignore "scattered clouds"
                if (key === 'polyline') {
                  return undefined; // Returning undefined removes the key
                }
                return value; // Otherwise, return the value as is
              }, 2)}
            </Text>
    
          </View>
        );
      })}
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
    color: "black",
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
