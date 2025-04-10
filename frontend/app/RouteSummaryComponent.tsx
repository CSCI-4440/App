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
	  console.log("sunset", sunsetStr);
	  console.log("arr", arrivalStr);
	  console.log("dur", durationStr);
	  console.log("curr", currentTime);
  
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
  
	  console.log(`Adjusted Current Time (UTC-4) → ${currentHour}:${currentMinute}`);
	  console.log(`Normalized Times → Sunset: ${sunsetHour}:${sunsetMinute}, Arrival: ${arrivalHour}:${arrivalMinute}`);
  
	  // Convert times to minutes from the start of the day for comparison
	  const currentTimeInMinutes = currentHour * 60 + currentMinute;
	  const sunsetTimeInMinutes = sunsetHour * 60 + sunsetMinute;
	  const arrivalTimeInMinutes = arrivalHour * 60 + arrivalMinute;
  
	  console.log("currentTimeInMinutes:", currentTimeInMinutes);
	  console.log("sunsetTimeInMinutes:", sunsetTimeInMinutes);
	  console.log("arrivalTimeInMinutes:", arrivalTimeInMinutes);
  
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
	  console.log("Elapsed Time (minutes):", elapsedTime);
  
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
	  console.log("DURATION (minutes):", durationMin);
	  console.log(`After sunset: ${percentage.toFixed(1)}%`);
  
	  return `${percentage.toFixed(1)}%`;
	} catch (error) {
	  console.error("Error in getPercentage function:", error);
	  return '0.0%'; // Default return value if there's an error
	}
  };
  
// const getPercentage = (sunsetStr: string, arrivalStr: string, durationStr: string, currentTime: Date | string): string => {
// 	try {
// 	  console.log("sunset", sunsetStr);
// 	  console.log("arr", arrivalStr);
// 	  console.log("dur", durationStr);
// 	  console.log("curr", currentTime);
  
// 	  // Convert all times to the same format (ignoring the year, month, and day)
// 	  const sunset = sunsetStr ? new Date(`1970-01-01T${convertTo24Hour(sunsetStr)}Z`) : null;  // Sunset time in UTC, or null
// 	  const arrival = new Date(`1970-01-01T${convertTo24Hour(arrivalStr)}Z`);  // Arrival time in UTC
  
// 	  // Ensure current time is in UTC if it's a string, otherwise use toISOString for consistency
// 	  const current = typeof currentTime === 'string' ? new Date(currentTime) : currentTime;
  
// 	  // Manually adjust for UTC-4 (do not change the hour or minute)
// 	  const currentUTCMinus4 = new Date(current);
// 	  currentUTCMinus4.setFullYear(1970);  // Adjust year to 1970
// 	  currentUTCMinus4.setMonth(0);        // Adjust month to January
// 	  currentUTCMinus4.setDate(1);        // Adjust month to January
// 	  // We don't touch the day, hour, minutes, or seconds. They stay the same.
  
// 	  console.log("Converted Times → Sunset:", sunset ? sunset.toISOString() : "null", "Current (UTC-4):", currentUTCMinus4.toISOString(), "Arrival:", arrival.toISOString());
  
// 	  // Handle case where sunset is null (if sunset data is not available)
// 	  if (!sunset) {
// 		console.error("Sunset time is missing.");
// 		return '0.0%'; // Default if sunset is missing
// 	  }
  
// 	  // Extract only the time portion for comparison (hours, minutes, seconds)
// 	  const getTimeOnly = (date: Date) => date.setFullYear(1970, 0, 1); // Set year, month, day to arbitrary values
  
// 	  // Set the times (ignoring the date) for comparison
// 	  getTimeOnly(sunset);
// 	  getTimeOnly(arrival);
// 	  getTimeOnly(currentUTCMinus4);
  
// 	  console.log("Adjusted Times → Sunset:", sunset.toISOString(), "Current (UTC-4):", currentUTCMinus4.toISOString(), "Arrival:", arrival.toISOString());
  
// 	  	  // If the trip has not started yet, return 0%
// 	if (arrival < sunset) {
// 		return '0.0%';
// 		}

// 	  // If the current time is after sunset, return 100% (the trip is over)
// 	  if (currentUTCMinus4 >= sunset) {
// 		return '100.0%';
// 	  }
  
  
// 	  // Calculate the elapsed time from current time to sunset
// 	  const elapsedTime = sunset.getTime() - currentUTCMinus4.getTime();
// 	  console.log("ELAPSED", elapsedTime);
  
// 	  // Parse the duration to get minutes (assuming the format "XX min")
// 	  const [durMinStr] = durationStr.split(' '); 
// 	  const durationMin = parseInt(durMinStr);
// 	  const durationMs = durationMin * 60 * 1000; // Convert duration to milliseconds
  
// 	  // Calculate the percentage of the trip completed based on the current time
// 	  const percentage = (elapsedTime / durationMs) * 100;
// 	  console.log("DURATION:", durationMs);
// 	  console.log(`After sunset: ${percentage.toFixed(1)}%`);
  
// 	  return `${percentage.toFixed(1)}%`;
  
// 	} catch (error) {
// 	  console.error("Error in getPercentage function:", error);
// 	  return '0.0%'; // Default return value if there's an error
// 	}
//   };  
  
  
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

				<Text style={styles.detail}>
					Sunset Time: {selectedRoute.sunset}
				</Text>

				<Text style={styles.detail}>
					After Sunset Percentage:
					{getPercentage(selectedRoute?.sunset , computeArrivalTime(currentTime, selectedRoute.duration), formatDuration(selectedRoute.duration), currentTime)}
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
