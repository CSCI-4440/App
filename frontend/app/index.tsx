import React, { useState, useRef } from "react";
import { Button, ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import 'react-native-get-random-values';
import LocationInput from "./locationInput";

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
        `http://localhost:3000/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );

      console.log("API Response:", response.data);
      if (response.data.routes && response.data.routes.length > 0) {
        console.log(response.data.routes);
        console.log(response.data.routes.length, "routes found");
        console.log("Best route:", response.data.routes[0]);
        console.log("Other routes:", response.data.routes.slice(1));
      }
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching route data api call:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <Button title="CLEAR CHOICES" onPress={clearOptions} />
        </View>
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

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
