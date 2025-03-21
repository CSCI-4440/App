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
import { Ionicons } from "@expo/vector-icons"; // <-- Import Ionicons from Expo
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";

export default function Index() {
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <LocationInput
            placeholder="Start Address"
            setAddress={setStartAddress}
            setLat={setStartLat}
            setLong={setStartLong}
            inputRef={startInputRef}
          />
          <LocationInput
            placeholder="Destination Address"
            setAddress={setDestinationAddress}
            setLat={setDestinationLat}
            setLong={setDestinationLong}
            inputRef={destinationInputRef}
          />
          <Button title="Get Routes" onPress={getRoutes} />
          <Button title="Clear Options" onPress
          ={clearOptions} />
        </View>
        <View style={styles.mapContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Text>Map Placeholder</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 10,
  },
  inputContainer: {
    marginBottom: 10,
  },
  mapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});