import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Button,
  Platform,
  SafeAreaView, Alert, ScrollView
} from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import DateTimeSelector from "./DateTimeSelector";
import { TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import Config from "../config";

// put the ip address here -- everyone (no other ip changes needed)
const baseUrl = "http://192.168.1.161:3000"

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
  
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

  const [selectedDate, setSelectedDate] = useState<string>(formattedToday);
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

  const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Enable location permissions to continue.");
        return false;
      }
      return true;
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

  const getRoutes = async () => {
    if (!startLat || !startLong || !destinationLat || !destinationLong) {
      alert("Please select valid addresses before searching for routes.");
      return;
    }
    setLoading(true);
    try {
      console.log("Start Coords:", startLat, startLong);
      console.log("Destination Coords:", destinationLat, destinationLong);

      try {
        const response = await axios.get(
          `${baseUrl}/api/changeStartRoutes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}&date=${selectedDate}&time=${selectedTime}`
        );
        setApiResponse(response.data);
      } catch (error) {
        console.error("Error fetching route data:", error);
        setApiResponse(null);
      }

    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      getLocation();
    }, []);

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

      {/* Floating UI Overlay */}
      <View style={styles.overlayContainer} pointerEvents="box-none">

      <View style={styles.inputWrapper}>
          <LocationInput
            placeholder={startAddress || "Enter starting address"}
            setAddress={setStartAddress}
            setLat={setStartLat}
            setLong={setStartLong}
            inputRef={startInputRef}
            header=""
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <LocationInput
            placeholder="Enter destination address"
            setAddress={setDestinationAddress}
            setLat={setDestinationLat}
            setLong={setDestinationLong}
            inputRef={destinationInputRef}
            header=""
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

            <View style={styles.changeStartButton}>
            <Button
              title="Change Time"
              onPress={() => setShowTimePicker(true)}
              color="#fff"
            />
            </View>
          </View>
          <Text style={styles.weatherInfo}>60° Mostly Clear</Text>
          <Text style={styles.alertTitle}>Severe Weather Alerts</Text>
          <Text style={styles.alertSubtitle}>Wind Advisory, Troy, NY</Text>
          <View style={styles.weatherAlertsButton}>
            <Button
              title="Weather Alerts"
              onPress={() => router.push("/settings")}
              color="#fff"
            />
          </View>
        </View>

        {/* DATA DISPLAY THING */}
        {apiResponse?.routes?.length > 0 && (
        <View style={styles.routeScrollWrapper}>
          <ScrollView>
            {apiResponse.routes.map((route: any, index: number) => (
              <View key={index} style={styles.routeCard}>
                <Text style={styles.routeTitle}>
                  {routeColors[index % routeColors.length].charAt(0).toUpperCase() +
                    routeColors[index % routeColors.length].slice(1)} Route
                </Text>
                <Text>
                  {JSON.stringify(
                    route,
                    (key, value) => (key === "polyline" ? undefined : value),
                    2
                  )}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      </View>
    
      <DateTimeSelector
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={(date, time) => {
          console.log("Selected date:", date);
          console.log("Selected time:", time.toLocaleTimeString());
          setSelectedDate(date);
          setSelectedTime(time);
          setShowTimePicker(false);
      }}
    />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  routeScrollWrapper: {
    maxHeight: 200,      // 👈 fixed height
    marginTop: 10,
  },  
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
