import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Button,
  ScrollView,
  Platform,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import { useRouter } from "expo-router";
import MapView, { Marker, Polyline, Callout } from "react-native-maps";
import DateTimeSelector from "./DateTimeSelector";


const baseUrl = Platform.OS === "ios" ? "http://129.161.136.89:3000" : "http://129.161.139.185:3000";

export default function Index() {
  const router = useRouter();
  const [startAddress, setStartAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

// Default start coordinates: Troy, NY
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






  // For route polylines
  const routeColors = ["blue", "green", "orange", "red", "purple"];
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

  const mapRef = useRef<MapView>(null);

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
      const response = await axios.get(
        `${baseUrl}/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}&date=${selectedDate}&time=${selectedTime}`
      );
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fit the map
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

      {/* MAP BACKGROUND (Touchable) */}
      <View style={styles.mapBackground}>
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
            const color = routeColors[index] || "gray";
            return (
              <React.Fragment key={index}>
                {route.polyline && (
                  <Polyline
                    coordinates={decodePolyline(route.polyline)}
                    strokeWidth={4}
                    strokeColor={color}
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
      </View>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="always"
        pointerEvents="none"  // <-- The map behind it will receive touches
      >
        <View style={styles.searchContainer} pointerEvents="auto">
          <LocationInput
            key="end"
            header="Enter destination address"
            placeholder="Enter destination address"
            setAddress={setDestinationAddress}
            setLat={setDestinationLat}
            setLong={setDestinationLong}
            inputRef={destinationInputRef}
          />
        </View>

        {/* Find & Clear Buttons */}
        <View style={styles.routeButtonRow} pointerEvents="auto">
          <View style={{ flex: 1, marginRight: 5 }}>
            <Button title="Find Routes" onPress={getRoutes} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Button title="Clear Choices" onPress={clearOptions} color="#fff" />
          </View>
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginVertical: 20 }}
          />
        )}

        {/* If we have routes, show them. Otherwise, show nothing. */}
        {apiResponse?.routes && apiResponse.routes.length > 0 && (
          <View style={styles.routesContainer}>
            {apiResponse.routes.map((route: any, index: number) => (
              <View key={index} style={styles.routeCard}>
                <Text style={styles.routeTitle}>Route {index + 1}</Text>
                <Text>Start Address: {JSON.stringify(route.startAddress)}</Text>
                <Text>
                  Destination Address: {JSON.stringify(route.destinationAddress)}
                </Text>
                <Text>
                  Time: {(route.durationSeconds / 60).toFixed(1)} minutes
                </Text>
                <Text>
                  Distance: {(route.distanceMeters / 1000).toFixed(2)} km
                </Text>
                <Text>Weather Score: {route.getPrecipitationPercent ?? "N/A"}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fixedInfoContainer} pointerEvents="auto">
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
            <Button title="Weather Alerts" onPress={() => {}} color="#fff" />
          </View>
        </View>
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

// STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  contentInner: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  searchContainer: {
    marginVertical: 10,
  },
  routeButtonRow: {
    flexDirection: "row",
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 12,
  },
  routesContainer: {
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: "#fff",
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
    marginBottom: 4,
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
});
