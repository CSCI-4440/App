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

const convertTo24Hour = (timeStr: string): string => {
	if (!timeStr) return '00:00:00';

	// Replace any smart spaces like U+202F (narrow no-break space) with normal spaces
	const cleanedStr = timeStr.replace(/\u202F/g, ' ').trim();

	const [time, modifier] = cleanedStr.split(' ');
	let [hours, minutes, seconds = '00'] = time.split(':');

	hours = parseInt(hours).toString();

	if (modifier == 'PM' && hours !== '12') {
		hours = (parseInt(hours) + 12).toString();
	} else if (modifier == 'AM' && hours === '12') {
		hours = '00';
	}

	hours = hours.padStart(2, '0');
	minutes = minutes.padStart(2, '0');
	seconds = seconds.padStart(2, '0');

	return `${hours}:${minutes}:${seconds}`;
};

const getPercentage = (
	sunsetStr: string,
	arrivalStr: string,
	durationStr: string,
	currentTime: Date | string
  ): string => {
	try {
  
	  // Convert sunset and arrival using the 24-hour conversion and fixed date
	  const sunset = new Date(`1970-01-01T${convertTo24Hour(sunsetStr)}Z`);
	  const arrival = new Date(`1970-01-01T${convertTo24Hour(arrivalStr)}Z`);
  
	  // Convert currentTime to a Date if needed and then normalize it to UTC
	  let current: Date;
	  if (typeof currentTime === "string") {
		current = new Date(currentTime); // Convert string to Date
	  } else {
		current = currentTime; // If it's already a Date object
	  }

	  // Adjust current time to UTC-4 by subtracting 4 hours
	  const currentUTCMinus4 = new Date(current);
	  currentUTCMinus4.setHours(currentUTCMinus4.getHours() - 5); // Adjust to UTC-4
  
	  // Extract only hours and minutes for current time
	  const currentHour = currentUTCMinus4.getHours();
	  const currentMinute = currentUTCMinus4.getMinutes();
  
	  // Normalize sunset and arrival times to hours and minutes only
	  const sunsetHour = sunset.getHours();
	  const sunsetMinute = sunset.getMinutes();
	  const arrivalHour = arrival.getHours();
	  const arrivalMinute = arrival.getMinutes();
  
	//   console.log(`Adjusted Current Time (UTC-4) → ${currentHour}:${currentMinute}`);
	//   console.log(`Normalized Times → Sunset: ${sunsetHour}:${sunsetMinute}, Arrival: ${arrivalHour}:${arrivalMinute}`);
  
	  // Convert times to minutes from the start of the day for comparison
	  const currentTimeInMinutes = currentHour * 60 + currentMinute;
	  const sunsetTimeInMinutes = sunsetHour * 60 + sunsetMinute;
	  const arrivalTimeInMinutes = arrivalHour * 60 + arrivalMinute;
  
	//   console.log("currentTimeInMinutes:", currentTimeInMinutes);
	//   console.log("sunsetTimeInMinutes:", sunsetTimeInMinutes);
	//   console.log("arrivalTimeInMinutes:", arrivalTimeInMinutes);
  
	  // If the trip has not started yet (arrival is before sunset), return 0%
	  if (arrivalTimeInMinutes < sunsetTimeInMinutes) {
		return '0.0%';
	  }
  
	  // If the current time is after sunset, return 100% (the trip is over)
	  if (currentTimeInMinutes >= sunsetTimeInMinutes) {
		return '100.0%';
	  }
  
	  // Calculate the elapsed time from current time to sunset
	  const elapsedTime = sunsetTimeInMinutes - currentTimeInMinutes;
	//   console.log("Elapsed Time (minutes):", elapsedTime);
  
	  // Parse the duration to get minutes (assuming the format "XX min")
	  const [durMinStr] = durationStr.split(' ');
	  const durationMin = parseInt(durMinStr);
	  const durationMs = durationMin * 60 * 1000; // Convert duration to milliseconds
  
	  // Calculate the percentage of the trip completed based on the current time
	  let percentage = (elapsedTime / durationMin) * 100;
	  if (percentage>1000)
	  {
		percentage=percentage/100; 
	  }
	  else if (percentage>100)
	  {
		percentage=percentage/10;
	  }
	//   console.log("DURATION (minutes):", durationMin);
	  console.log(`After sunset: ${percentage.toFixed(1)}%`);
  
	  return `${percentage.toFixed(1)}%`;
	} catch (error) {
	  console.error("Error in getPercentage function:", error);
	  return '0.0%'; // Default return value if there's an error
	}
  };

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
			{/* Always show tab bar, even for one route */}
			<View style={styles.tabRow}>
				{routes.length === 1 ? (
					<View style={[styles.tab, { backgroundColor: routeColors[0] }]}>
						<Text style={[styles.tabText, { color: '#fff' }]}>
							{routeColors[0].charAt(0).toUpperCase() + routeColors[0].slice(1)}
						</Text>
					</View>
				) : (
					routes.map((_, index) => {
						const color = routeColors[index % routeColors.length]
						return (
							<TouchableOpacity
								key={index}
								onPress={() => setSelectedRouteIndex(index)}
								style={[
									styles.tab,
									{ backgroundColor: selectedRouteIndex === index ? color : '#eee' },
								]}
							>
								<Text
									style={[
										styles.tabText,
										{ color: selectedRouteIndex === index ? '#fff' : '#333' },
									]}
								>
									{color.charAt(0).toUpperCase() + color.slice(1)}
								</Text>
							</TouchableOpacity>
						)
					})
				)}
			</View>

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
  					Departure: {selectedRoute?.departure}
				</Text>
				<Text style={styles.detail}>
					Arrival:{' '}
					{selectedRoute?.duration
						? computeArrivalTime(currentTime, selectedRoute.duration)
						: 'N/A'}
				</Text>

				<Text style={styles.detail}>
					Sunset Time: {selectedRoute.sunsetTime}
				</Text>

				<Text style={styles.detail}>
					After Sunset Percentage:
					{getPercentage(selectedRoute?.sunsetTime , computeArrivalTime(currentTime, selectedRoute.duration), formatDuration(selectedRoute.duration), currentTime)}
				</Text>

				{/* <Text style={styles.sectionHeader}>Weather Info</Text>
				{weatherStats.map((stat, index) => (
					<Text key={index} style={styles.detail}>
						{stat.label}: {stat.value}
					</Text>
				))} */}
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
	tabText: {
		fontSize: 14,
		color: '#333',
	},
})

export default RouteSummaryCard
