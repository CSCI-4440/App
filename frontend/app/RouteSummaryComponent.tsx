/**
 * @file RouteSummaryComponent.tsx
 * @description A React Native component that displays a summary of the selected route for a trip.
 * It includes information such as start and destination locations, estimated arrival time, distance, and weather conditions.
 * The component also provides buttons to start the trip or cancel it.
 * It allows users to select between multiple routes if available.
 * The component is styled using React Native's StyleSheet and includes a tabbed interface for route selection.
 * The weather information is displayed in a scrollable view under the route details.
 */

import React from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Text } from 'react-native-paper'

type WeatherStat = {
	label: string
	value: string
}

type Props = {
	start: string
	destination: string
	arrival: string
	weatherStats: WeatherStat[]
	onStartTrip: () => void
	onCancel: () => void
	routes: any[]
	selectedRouteIndex: number
	setSelectedRouteIndex: (index: number) => void
	routeColors: string[]
	currentTime: Date
}

const formatDuration = (seconds: number) => {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.round((seconds % 3600) / 60)
	return `${hours > 0 ? `${hours} hr ` : ''}${minutes} min`
}

const metersToMiles = (meters: number) => {
	const miles = meters / 1609.34
	return `${miles.toFixed(1)} mi`
}

const computeArrivalTime = (startTime: Date, durationInSeconds: number) => {
	const arrival = new Date(startTime.getTime() + durationInSeconds * 1000)
	return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const RouteSummaryCard = ({
	start,
	destination,
	arrival,
	weatherStats,
	onStartTrip,
	onCancel,
	routes,
	selectedRouteIndex,
	setSelectedRouteIndex,
	routeColors,
	currentTime,
}: Props) => {
	const selectedRoute = routes[selectedRouteIndex]
	console.log('Selected route data: ', selectedRoute)

	return (
		<View style={styles.card}>
			{routes.length > 1 && (
				<View style={styles.tabRow}>
					{routes.map((_, index) => {
						const color = routeColors[index % routeColors.length]
						return (
							<TouchableOpacity
								key={index}
								onPress={() => setSelectedRouteIndex(index)}
								style={[
									styles.tab,
									{
										backgroundColor: selectedRouteIndex === index ? color : '#eee',
									},
								]}
							>
								<Text
									style={[
										styles.tabText,
										{
											color: selectedRouteIndex === index ? '#fff' : '#333',
										},
									]}
								>
									{color.charAt(0).toUpperCase() + color.slice(1)}
								</Text>
							</TouchableOpacity>
						)
					})}
				</View>
			)}

			<ScrollView style={styles.scroll}>
				<Text style={styles.routeTitle}>
					{start} → {destination}
				</Text>
				<Text style={styles.detail}>
					Duration: {selectedRoute?.duration ? formatDuration(selectedRoute.duration) : 'N/A'}
				</Text>
				<Text style={styles.detail}>
					Distance: {selectedRoute?.distance ? metersToMiles(selectedRoute.distance) : 'N/A'}
				</Text>

				<Text style={styles.detail}>
					Arrival:{' '}
					{selectedRoute?.duration
						? computeArrivalTime(currentTime, selectedRoute.duration)
						: 'N/A'}
				</Text>

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
	)
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#fff',
		padding: 16,
		elevation: 4,
		height: 250,
		borderTopLeftRadius: 0,
		borderTopRightRadius: 0,
	},
	scroll: {
		maxHeight: 240,
	},
	routeTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	detail: {
		fontSize: 16,
		marginBottom: 4,
	},
	sectionHeader: {
		fontSize: 16,
		fontWeight: 'bold',
		marginTop: 12,
		marginBottom: 4,
	},
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 16,
	},
	buttonStart: {
		backgroundColor: '#28a745',
		padding: 12,
		borderRadius: 8,
		flex: 1,
		marginRight: 8,
		alignItems: 'center',
	},
	buttonCancel: {
		backgroundColor: '#dc3545',
		padding: 12,
		borderRadius: 8,
		flex: 1,
		marginLeft: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	tabRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 12,
	},
	tab: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		backgroundColor: '#eee',
		marginHorizontal: 4,
		borderRadius: 20,
	},
	activeTab: {
		backgroundColor: '#007bff',
	},
	tabText: {
		fontSize: 14,
		color: '#333',
	},
	activeTabText: {
		color: '#fff',
		fontWeight: 'bold',
	},
})

export default RouteSummaryCard
