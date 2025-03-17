import React, { useState , useRef } from "react";
import { Button, ActivityIndicator, ScrollView, StyleSheet, View} from "react-native";
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

  const startInputRef = useRef<any>(null);
  const destinationInputRef = useRef<any>(null);

  // reset
  const clearOptions = () => {
    setStartAddress("")
    setDestinationAddress("")
    setStartLat(null)
    setStartLong(null)
    setDestinationLat(null)
    setDestinationLong(null)
    setApiResponse(null)
    setLoading(false)
    startInputRef.current?.clear()
    destinationInputRef.current?.clear()
  }

  const getRoutes = async () => {
    if (!startLat || !startLong || !destinationLat || !destinationLong) {
      alert("Please select valid addresses before searching for routes.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `http://10.0.2.2:3000/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );

      console.log("API Response:", response.data);
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching route data api call:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("Current apiResponse state:", apiResponse);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always" >

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
  buttonWrapper: {
    flexDirection: "column",
  },
  buttonContainer: {
    marginBottom: 10, // Adjust spacing as needed
  }
});