import React, { useState } from "react";
import { Button, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
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

  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getRoutes = async () => {
    console.log("Start Address:", startAddress);
    console.log("Destination Address:", destinationAddress);

    if (!startLat || !startLong || !destinationLat || !destinationLong) {
      alert("Please select valid addresses before searching for routes.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/api/routes", {
        startLat,
        startLong,
        destinationLat,
        destinationLong,
      });

      console.log("API Response:", response.data);
      setApiResponse({ ...response.data }); // Fix: Ensure re-render
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("Current apiResponse state:", apiResponse); // Debugging

  return (
    <ScrollView style={styles.container}>

      {/* Start Address Input */}
      <LocationInput
        key="start"
        placeholder="Enter starting address"
        setAddress={setStartAddress}
        setLat={setStartLat}
        setLong={setStartLong}
      />

      {/* Destination Address Input */}
      <LocationInput
        key="end"
        placeholder="Enter destination address"
        setAddress={setDestinationAddress}
        setLat={setDestinationLat}
        setLong={setDestinationLong}
      />

      <Button title="Find Routes" onPress={getRoutes} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

        <ScrollView>
          <Text style={styles.jsonText} key={JSON.stringify(apiResponse)}>
            {apiResponse ? JSON.stringify(apiResponse, null, 2) : "No data available"}
          </Text>
      </ScrollView>

    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "black",
  },
});