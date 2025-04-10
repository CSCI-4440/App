/**
 * @file Settings.tsx
 * @description A React Native component that provides a settings screen for the STRATUS app.
 * It allows users to toggle alerts for snow, rain, and wind, as well as the option to use the current location.
 * The component is styled using React Native's StyleSheet and includes a button to save the settings.
 * */

import React, { useState } from 'react'
import { View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

/**
 * @function Settings
 * @description A React Native component that provides a settings screen for the STRATUS app.
 * @returns {JSX.Element} - A React Native component that provides a settings screen for the STRATUS app.
 */
export default function Settings() {
	// Initialize the router for navigation
	const router = useRouter()

	// State variables to manage alerts and location settings
	const [alerts, setAlerts] = useState({
		snow: true,
		rain: true,
		wind: true,
	})

	// State variable to manage the use of current location
	const [useLocation, setUseLocation] = useState(true)

	// Function to toggle alert settings
	const toggleAlert = (key: keyof typeof alerts) => {
		setAlerts({ ...alerts, [key]: !alerts[key] })
	}

	// Render the settings screen
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text style={styles.sectionTitle}>Alerts</Text>

				<View style={styles.row}>
					<Text style={styles.label}>Snow</Text>
					<Switch value={alerts.snow} onValueChange={() => toggleAlert('snow')} />
				</View>

				<View style={styles.row}>
					<Text style={styles.label}>Rain</Text>
					<Switch value={alerts.rain} onValueChange={() => toggleAlert('rain')} />
				</View>

				<View style={styles.row}>
					<Text style={styles.label}>Wind</Text>
					<Switch value={alerts.wind} onValueChange={() => toggleAlert('wind')} />
				</View>

				<Text style={styles.sectionTitle}>Location</Text>
				<View style={styles.row}>
					<Text style={styles.label}>Use my current location</Text>
					<Switch value={useLocation} onValueChange={() => setUseLocation(!useLocation)} />
				</View>

				<Text style={styles.sectionTitle}>Unit</Text>
				<View style={styles.row}>
					<Text style={styles.label}>Fahrenheit</Text>
				</View>

				<TouchableOpacity
					style={styles.doneButton}
					onPress={() => router.push({ pathname: '/', params: { skipSplash: 'true' } })}
				>
					<Text style={styles.doneButtonText}>Done</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	)
}

// Styles for the Settings component
const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f8fbfd',
	},
	container: {
		flex: 1,
		backgroundColor: '#f8fbfd',
		padding: 20,
		justifyContent: 'flex-start',
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#111',
		marginTop: 24,
		marginBottom: 12,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
	},
	label: {
		fontSize: 16,
		color: '#222',
	},
	doneButton: {
		backgroundColor: '#007bff',
		borderRadius: 12,
		marginTop: 40,
		paddingVertical: 16,
		alignItems: 'center',
	},
	doneButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
})