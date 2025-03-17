import React, { useState, useRef, useEffect } from "react";
import { Button, ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import axios from "axios";
import "react-native-get-random-values";
import LocationInput from "./locationInput";
import MapView, { Polyline, PROVIDER_GOOGLE, LatLng } from "react-native-maps";
import polyline from "@mapbox/polyline";

export default function Index() {
  const [startAddress, setStartAddress] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLong, setStartLong] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLong, setDestinationLong] = useState<number | null>(null);

  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [polylines, setPolylines] = useState<{ latitude: number; longitude: number }[][]>([]);

  const startInputRef = useRef<any>(null);
  const destinationInputRef = useRef<any>(null);
  const mapRef = useRef<MapView>(null);

  // Reset function
  const clearOptions = () => {
    setPolylines([]);
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

  // Polyline Decoder
  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const decoded: [number, number][] = polyline.decode(encoded);
    return decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
  };

  // Fetch Routes
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
        `http://10.0.2.2:3000/api/routes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}`
      );

      setApiResponse(response.data);

      // Extract and decode polylines from the response
      const decodedPolylines = response.data.routes.map((route: { legs: any[] }) =>
        route.legs.flatMap((leg) => decodePolyline(leg.polyline))
      );

      setPolylines(decodedPolylines);
      console.log("Number of polylines:", decodedPolylines.length);
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect to update the map region when polylines change
  useEffect(() => {
    if (polylines.length > 0 && mapRef.current) {
      // Flatten all coordinates from all routes into one array
      const allCoords: LatLng[] = polylines.flat();
      if (allCoords.length > 0) {
        mapRef.current.fitToCoordinates(allCoords, {
          edgePadding: { top: 20, right: 20, bottom: 20, left: 20 },
          animated: true,
        });
      }
    }
  }, [polylines]);

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

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: startLat ?? 37.78825,
            longitude: startLong ?? -122.4324,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {polylines.map((polylineCoords, index) => (
            <Polyline
              key={index}
              coordinates={polylineCoords}
              strokeWidth={3}
              strokeColor="red"
            />
          ))}
        </MapView>
      </View>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <View style={styles.buttonContainer}>
          <Button title="Find Routes" onPress={getRoutes} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="CLEAR CHOICES" onPress={clearOptions} />
        </View>
      </View>

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {/* API Response */}
      <ScrollView>
        <Text style={styles.jsonText}>
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
  mapContainer: {
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 10,
  },
  map: {
    flex: 1,
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "black",
  },
  buttonWrapper: {
    flexDirection: "column",
    marginTop: 10,
  },
  buttonContainer: {
    marginBottom: 10,
  },
});