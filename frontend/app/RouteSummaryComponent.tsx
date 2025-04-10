import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  start: string;
  destination: string;
  duration: string;
  distance: string;
  tolls: string;
  leaveBy: string;
  arrival: string;
  weatherStats: { label: string; value: string }[];
  onCancel: () => void;
  onStartTrip: () => void;
};

export default function RouteSummaryCard({
  start,
  destination,
  duration,
  distance,
  tolls,
  leaveBy,
  arrival,
  weatherStats,
  onCancel,
  onStartTrip,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {start} to {destination}
      </Text>

      <View style={styles.tabRow}>
        <Text style={styles.activeTab}>Best Weather</Text>
        <Text style={styles.inactiveTab}>Alternative Route</Text>
      </View>

      <Text style={styles.stats}>
        {duration} <Text style={styles.subText}>({distance})</Text>
      </Text>
      <Text style={styles.stats}>{tolls}</Text>
      <Text style={styles.stats}>Leave By: {leaveBy}</Text>
      <Text style={styles.stats}>Arrival Time: {arrival}</Text>

      <Text style={styles.forecastHeader}>Details about the forecast</Text>
      {weatherStats.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.weatherLabel}>{item.label}</Text>
          <Text style={styles.weatherValue}>{item.value}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.startButton} onPress={onStartTrip}>
        <Text style={styles.startButtonText}>Start Trip</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fbfd",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  activeTab: {
    backgroundColor: "#555",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  inactiveTab: {
    backgroundColor: "#ddd",
    color: "#444",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  stats: {
    fontSize: 16,
    marginBottom: 4,
  },
  subText: {
    color: "#888",
  },
  forecastHeader: {
    marginTop: 12,
    fontWeight: "bold",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  weatherLabel: {
    fontSize: 15,
  },
  weatherValue: {
    fontSize: 15,
  },
  startButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#007bff",
    fontSize: 16,
  },
});
