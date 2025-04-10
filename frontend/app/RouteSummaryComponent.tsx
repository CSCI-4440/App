import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";

type WeatherStat = {
  label: string;
  value: string;
};

type Props = {
  start: string;
  destination: string;
  duration: string;
  distance: string;
  tolls: string;
  leaveBy: string;
  arrival: string;
  weatherStats: WeatherStat[];
  onStartTrip: () => void;
  onCancel: () => void;
  routes: any[];
  selectedRouteIndex: number;
  setSelectedRouteIndex: (index: number) => void;
  routeColors: string[];
};

const RouteSummaryCard = ({
  start,
  destination,
  duration,
  distance,
  tolls,
  leaveBy,
  arrival,
  weatherStats,
  onStartTrip,
  onCancel,
  routes,
  selectedRouteIndex,
  setSelectedRouteIndex,
  routeColors
}: Props) => {
  return (
    <View style={styles.card}>
      {/* Route Tabs */}
      {routes && routes.length > 1 && (
        <View style={styles.tabRow}>
          {routes.map((_, index) => {
            const color = routeColors[index % routeColors.length];
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedRouteIndex(index)}
                style={[
                  styles.tab,
                  { backgroundColor: selectedRouteIndex === index ? color : "#eee" },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: selectedRouteIndex === index ? "#fff" : "#333" },
                  ]}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ScrollView style={styles.scroll}>
        <Text style={styles.routeTitle}>{start} → {destination}</Text>
        <Text style={styles.detail}>Duration: {duration}</Text>
        <Text style={styles.detail}>Distance: {distance}</Text>
        <Text style={styles.detail}>Tolls: {tolls}</Text>
        <Text style={styles.detail}>Leave by: {leaveBy}</Text>
        <Text style={styles.detail}>Arrival: {arrival}</Text>

        <Text style={styles.sectionHeader}>Weather Info</Text>
        {weatherStats.map((stat, index) => (
          <Text key={index} style={styles.detail}>
            {stat.label}: {stat.value}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.buttonStart} onPress={onStartTrip}>
          <Text style={styles.buttonText}>Start Trip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonCancel} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 4,
    maxHeight: 400,
  },
  scroll: {
    maxHeight: 240,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detail: {
    fontSize: 16,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  buttonStart: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#eee",
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#007bff",
  },
  tabText: {
    fontSize: 14,
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default RouteSummaryCard;
