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

/**
 * @typedef {Object} WeatherStat
 * @property {string} label - The label for the weather statistic (e.g., "Temperature").
 * @property {string} value - The value of the weather statistic (e.g., "75°F").
 * @description Represents a weather statistic to be displayed in the route summary.
 */
type WeatherStat = {
	label: string
	value: string
}

/**
 * @typedef {Object} Props
 * @property {string} start - The starting location of the trip.
 * @property {string} destination - The destination location of the trip.
 * @property {string} arrival - The estimated arrival time.
 * @property {WeatherStat[]} weatherStats - An array of weather statistics to be displayed.
 * @property {() => void} onCancel - Callback function to be called when the user cancels the trip.
 * @property {any[]} routes - An array of route objects containing route data.
 * @property {number} selectedRouteIndex - The index of the currently selected route.
 * @property {(index: number) => void} setSelectedRouteIndex - Function to set the selected route index.
 * @property {string[]} routeColors - An array of colors for the route tabs.
 * @property {Date} currentTime - The current time to compute the arrival time.
 * @description Props for the RouteSummaryComponent.
 */
type Props = {
	start: string
	destination: string
	arrival: string
	weatherStats: WeatherStat[]
	onCancel: () => void
	routes: any[]
	selectedRouteIndex: number
	setSelectedRouteIndex: (index: number) => void
	routeColors: string[]
	currentTime: Date
}

/**
 * @function formatDuration
 * @description Formats a duration in seconds into a human-readable string.
 * @param seconds - The duration in seconds to be formatted.
 * @returns {string} - A string representing the formatted duration (e.g., "1 hr 30 min").
 */
const formatDuration = (seconds: number) => {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.round((seconds % 3600) / 60)
	return `${hours > 0 ? `${hours} hr ` : ''}${minutes} min`
}

/**
 * @function metersToMiles
 * @description Converts a distance in meters to miles and formats it as a string.
 * @param meters - The distance in meters to be converted.
 * @returns {string} - A string representing the distance in miles (e.g., "1.5 mi").
 */
const metersToMiles = (meters: number) => {
	const miles = meters / 1609.34
	return `${miles.toFixed(1)} mi`
}

/**
 * @function computeArrivalTime
 * @description Computes the estimated arrival time based on the start time and duration.
 * @param startTime - The start time of the trip.
 * @param durationInSeconds - The duration of the trip in seconds.
 * @returns {string} - A string representing the estimated arrival time in "HH:MM AM/PM" format.
 */
const computeArrivalTime = (startTime: Date, durationInSeconds: number) => {
	const arrival = new Date(startTime.getTime() + durationInSeconds * 1000)
	return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * @function convertTo24Hour
 * @description Converts a 12-hour time string to a 24-hour format.
 * @param timeStr - The time string to be converted (e.g., "2:30 PM").
 * @returns {string} - A string representing the time in 24-hour format (e.g., "14:30").
 */
const convertTo24Hour = (timeStr: string): string => {
	if (!timeStr) return '00:00:00'

	// Replace any smart spaces like U+202F (narrow no-break space) with normal spaces
	const cleanedStr = timeStr.replace(/\u202F/g, ' ').trim()

	const [time, modifier] = cleanedStr.split(' ')
	let [hours, minutes, seconds = '00'] = time.split(':')

	hours = parseInt(hours).toString()

	if (modifier == 'PM' && hours !== '12') {
		hours = (parseInt(hours) + 12).toString()
	} else if (modifier == 'AM' && hours === '12') {
		hours = '00'
	}

	hours = hours.padStart(2, '0')
	minutes = minutes.padStart(2, '0')
	seconds = seconds.padStart(2, '0')

	return `${hours}:${minutes}:${seconds}`
}

const parseDuration = (durationStr: string): number => {
	const hourMatch = durationStr.match(/(\d+)\s*hr/)
	const minuteMatch = durationStr.match(/(\d+)\s*min/)

	const hours = hourMatch ? parseInt(hourMatch[1]) : 0
	const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0

	return hours * 60 + minutes
}

const getArrivalTime = (departureTime: Date, durationInMinutes: number): Date => {
	const arrival = new Date(departureTime.getTime() + durationInMinutes * 60 * 1000)
	return arrival
}

/**
 * @function getPercentage
 * @description Calculates the percentage of the trip completed after sunset.
 * @param sunset - The sunset time as a Date object
 * @param sunset - The sunrise time as a Date object
 * @param arrivalStr - The arrival time string in 12-hour format (e.g., "8:00 PM").
 * @param durationStr - The duration string (e.g., "30 min").
 * @param departure - The departure time as a Date object
 * @returns {string} - A string representing the percentage of the trip completed after sunset.
 */
const getPercentage = (
	sunset: Date,
	sunrise: Date,
	arrivalStr: string,
	durationStr: string,
	departure: Date,
): string => {
	try {
		const durationMin = parseDuration(durationStr)
		const date = `${departure.getFullYear()}-${departure.getMonth()}-`

		if (durationMin === 0) return '0.0%'

		// Convert string arrival time (e.g., "19:30") into a Date object in UTC
		const arrival = getArrivalTime(departure, durationMin)

		const toMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes()
		const driveStartMin = toMinutes(departure)
		const driveEndMin = driveStartMin + durationMin
		const sunsetMin = toMinutes(sunset)
		const sunriseMin = toMinutes(sunrise) + 1440

		let nightMinutes = 0

		for (let min = driveStartMin; min < driveEndMin; min++) {
			const t = min % (24 * 60) // wrap around midnight
			const isNight =
				sunsetMin < sunriseMin
					? t >= sunsetMin && t < sunriseMin // typical case (same night)
					: t >= sunsetMin || t < sunriseMin // spans midnight

			if (isNight) nightMinutes++
		}

		const percent = (nightMinutes / durationMin) * 100
		return `${percent.toFixed(1)}%`
	} catch (error) {
		console.error('Error calculating nighttime percentage:', error)
		return '0.0%'
	}
}

/**
 * @function RouteSummaryCard
 * @description A React Native component that displays a summary of the selected route for a trip.
 * @returns {JSX.Element} - A React Native component that displays the route summary.
 * @param {Props} props - The props for the RouteSummaryCard component.
 */
const RouteSummaryCard = ({
	start,
	destination,
	arrival,
	weatherStats,
	onCancel,
	routes,
	selectedRouteIndex,
	setSelectedRouteIndex,
	routeColors,
	currentTime,
}: Props) => {
	const selectedRoute = routes[selectedRouteIndex]
	// console.log('Selected route data: ', selectedRoute)

	// Render the route summary card
	return (
		<View style={styles.card}>
			{routes.length > 3 ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.tabRowScrollable}
				>
					{routes.map((_, index) => {
						const color = routeColors[index % routeColors.length]
						const label =
							index === 0
								? 'Best Route'
								: index === routes.length - 1
									? 'Alternate Timing'
									: `Route ${index + 1}`

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
										{ color: selectedRouteIndex === index ? '#fff' : '#333' },
									]}
								>
									{label}
								</Text>
							</TouchableOpacity>
						)
					})}
				</ScrollView>
			) : (
				<View style={styles.tabRow}>
					{routes.map((_, index) => {
						const color = routeColors[index % routeColors.length]
						const label =
							index === 0
								? 'Best Route'
								: index === routes.length - 1
									? 'Alternate Timing'
									: `Route ${index + 1}`

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
										{ color: selectedRouteIndex === index ? '#fff' : '#333' },
									]}
								>
									{label}
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
					Departure:{' '}
					{selectedRoute?.departure
						? new Date(selectedRoute.departure).toLocaleString([], {
								dateStyle: 'medium',
								timeStyle: 'short',
							})
						: 'N/A'}
				</Text>
				<Text style={styles.detail}>
					Arrival:{' '}
					{selectedRoute?.duration
						? computeArrivalTime(new Date(selectedRoute?.departure), selectedRoute.duration)
						: 'N/A'}
				</Text>

				<Text style={styles.detail}>
					Sunset Time:{' '}
					{selectedRoute?.sunsetTime
						? new Date(selectedRoute.sunsetTime).toLocaleString([], {
								timeStyle: 'short',
							})
						: 'N/A'}
				</Text>

				<Text style={styles.detail}>
					After Sunset Percentage:
					{getPercentage(
						new Date(selectedRoute?.sunsetTime),
						new Date(selectedRoute?.sunriseTime),
						computeArrivalTime(new Date(selectedRoute?.departure), selectedRoute.duration),
						formatDuration(selectedRoute.duration),
						new Date(selectedRoute?.departure),
					)}
				</Text>

				<Text style={styles.detail}>Bad Weather Score: {selectedRoute?.weatherScore}</Text>

				<Text style={styles.sectionHeader}>Weather Info:</Text>
				{selectedRoute?.weatherBreakdown &&
					Object.entries(selectedRoute.weatherBreakdown as Record<string, number>).map(
						([condition, percent], index) => (
							<Text key={index} style={styles.detail}>
								{condition.charAt(0).toUpperCase() + condition.slice(1)}: {percent}%
							</Text>
						),
					)}
			</ScrollView>

			<View style={styles.buttonRow}>
				<TouchableOpacity style={styles.buttonCancel} onPress={onCancel}>
					<Text style={styles.buttonText}>Cancel</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

// Styles for the RouteSummaryCard component
const styles = StyleSheet.create({
	card: {
		backgroundColor: '#fff',
		paddingTop: 12, // ⬅ was 8 — slightly more room at the top
		paddingHorizontal: 16,
		paddingBottom: 16,
		elevation: 4,
		height: 260,
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

	tabRowScrollable: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		marginTop: 6,
		marginBottom: 12,
	},

	tab: {
		paddingVertical: 6,
		paddingHorizontal: 14,
		backgroundColor: '#eee',
		marginRight: 8,
		borderRadius: 20,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},

	tabText: {
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
		includeFontPadding: false,
		textAlignVertical: 'center',
	},
})

export default RouteSummaryCard
