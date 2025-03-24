import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();  
  const [startAddress, setStartAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLong, setStartLong] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLong, setDestinationLong] = useState<number | null>(null);

  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const startInputRef = useRef<any>(null);
  const destinationInputRef = useRef<any>(null);

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
        `http://localhost:3000/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mapBackground}>
        <Text style={styles.mapPlaceholderText}>Map Placeholder</Text>
      </View>

      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="always"
      >
        {/* Destination Input*/}
        <View style={styles.searchContainer}>
          <LocationInput
            key="end"
            placeholder="Enter destination address"
            setAddress={setDestinationAddress}
            setLat={setDestinationLat}
            setLong={setDestinationLong}
            inputRef={destinationInputRef}
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

        {loading && (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginVertical: 20 }}
          />
        )}

        {apiResponse && apiResponse.routes && apiResponse.routes.length > 0 ? (
          <View style={styles.routesContainer}>
            {apiResponse.routes.map((route: any, index: number) => (
              <View key={index} style={styles.routeCard}>
                <Text style={styles.routeTitle}>Route {index + 1}</Text>
                <Text>Start Address: {JSON.stringify(route.startAddress)}</Text>
                <Text>
                  Destination Address:{" "}
                  {JSON.stringify(route.destinationAddress)}
                </Text>
                <Text>Time: {(route.durationSeconds / 60).toFixed(1)} minutes</Text>
                <Text>Distance: {(route.distanceMeters / 1000).toFixed(2)} km</Text>
                <Text>Weather Score: {route.weatherScore ?? "N/A"}</Text>
              </View>
            ))}
          </View>
        ) : (
          !loading && <Text style={styles.noDataText}>No routes available</Text>
        )}
      </ScrollView>

      {/*bottom info card */}
      <View style={styles.fixedInfoContainer}>
        <View style={styles.infoCard}>
          <View style={styles.locationRow}>
            <Text style={styles.locationTitle}>Troy, NY</Text>
            <View style={styles.changeStartButton}>
              <Button title="Change Start" onPress={() => {router.push("/changeStart");}} color="#fff" />
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
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholderText: {
    color: "#888",
    fontWeight: "bold",
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
  noDataText: {
    marginTop: 20,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
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
