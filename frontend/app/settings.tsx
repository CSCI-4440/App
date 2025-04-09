import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Button
} from "react-native";
import { useRouter } from "expo-router";

export default function Settings() {
    const router = useRouter();
    const [alerts, setAlerts] = useState({
        snow: true,
        rain: true,
        wind: true,
    });

    const [useLocation, setUseLocation] = useState(true);

    const toggleAlert = (key: keyof typeof alerts) => {
        setAlerts({ ...alerts, [key]: !alerts[key] });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <Text style={styles.sectionTitle}>Alerts</Text>

        <View style={styles.row}>
        <Text style={styles.label}>Snow</Text>
        <Switch
            value={alerts.snow}
            onValueChange={() => toggleAlert("snow")}
        />
        </View>

        <View style={styles.row}>
            <Text style={styles.label}>Rain</Text>
            <Switch
            value={alerts.rain}
            onValueChange={() => toggleAlert("rain")}
        />
        </View>

        <View style={styles.row}>
            <Text style={styles.label}>Wind</Text>
            <Switch
            value={alerts.wind}
            onValueChange={() => toggleAlert("wind")}
            />
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.row}>
            <Text style={styles.label}>Use my current location</Text>
            <Switch
            value={useLocation}
            onValueChange={() => setUseLocation(!useLocation)}
            />
        </View>

        <Text style={styles.sectionTitle}>Unit</Text>
        <View style={styles.row}>
        <Text style={styles.label}>Fahrenheit</Text>
        </View>

        <TouchableOpacity style={styles.doneButton}>
            <Button
                title = "Done"
                onPress={() => router.push("/")}
                color="#fff"
            />
            </TouchableOpacity>
        </View>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        backgroundColor: "#f8fbfd",
        margin: 20,
        borderRadius: 10,
        padding: 20,
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111",
        marginTop: 20,
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 8,
    },
    label: {
        fontSize: 16,
        color: "#222",
    },
    doneButton: {
        backgroundColor: "#007bff",
        borderRadius: 12,
        overflow: "hidden",
    },
    doneButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
