import React, { useState, useRef, useEffect } from 'react'
import {
	View,
	StyleSheet,
	ActivityIndicator,
	Button,
	Platform,
	SafeAreaView,
	Alert,
	ScrollView,
	Animated,
	TouchableOpacity,
} from 'react-native'
import { Text } from 'react-native-paper'
import axios from 'axios'
import 'react-native-get-random-values'
import LocationInput from './locationInput'
import { useRouter } from 'expo-router'
import MapView, { Marker, Polyline } from 'react-native-maps'
import DateTimeSelector from './DateTimeSelector'
import RouteSummaryCard from './RouteSummaryComponent'
import SplashScreen from './SplashScreen'
import * as Location from 'expo-location'
import Config from '../config'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


const baseUrl = "http://129.161.138.122:3000"

export default function Index() {
	const router = useRouter();
	const insets = useSafeAreaInsets()

	const [showSplash, setShowSplash] = useState(true)

	const [startAddress, setStartAddress] = useState("");
	const [destinationAddress, setDestinationAddress] = useState("");

	const [startLat, setStartLat] = useState<number | null>(42.7284117);
	const [startLong, setStartLong] = useState<number | null>(-73.69178509999999);
	const [destinationLat, setDestinationLat] = useState<number | null>(null);
	const [destinationLong, setDestinationLong] = useState<number | null>(null);

	const [apiResponse, setApiResponse] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const startInputRef = useRef<any>(null);
	const destinationInputRef = useRef<any>(null);

	const [selectedTime, setSelectedTime] = useState<Date>(new Date());
	const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

	const today = new Date();
	const formattedToday = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

	const [selectedDate, setSelectedDate] = useState<string>(formattedToday);
	const mapRef = useRef<MapView>(null);

	const routeColors = ["blue", "green", "orange", "red", "purple"];
	const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

	const [isChangingStart, setIsChangingStart] = useState(false)
	const [showStartInput, setShowStartInput] = useState(false)
	const slideAnim = useRef(new Animated.Value(0)).current

	const summaryAnim = useRef(new Animated.Value(0)).current

	const toggleChangeStart = () => {
		const toValue = isChangingStart ? 0 : 1
		if (toValue === 1) setShowStartInput(true)

		Animated.timing(slideAnim, {
			toValue,
			duration: 300,
			useNativeDriver: false,
		}).start(() => {
			if (toValue === 0) setShowStartInput(false)
		})

		setIsChangingStart(!isChangingStart)
	}

	const decodePolyline = (encoded: string) => {
		let points = []
		let index = 0,
			lat = 0,
			lng = 0
		while (index < encoded.length) {
			let b,
				shift = 0,
				result = 0
			do {
				b = encoded.charCodeAt(index++) - 63
				result |= (b & 0x1f) << shift
				shift += 5
			} while (b >= 0x20)
			const dlat = result & 1 ? ~(result >> 1) : result >> 1
			lat += dlat

			shift = 0
			result = 0
			do {
				b = encoded.charCodeAt(index++) - 63
				result |= (b & 0x1f) << shift
				shift += 5
			} while (b >= 0x20)
			const dlng = result & 1 ? ~(result >> 1) : result >> 1
			lng += dlng

			points.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
		}
		return points
	}

	function toGoogleTime(dateStr: string, time: Date): string {
		const t = new Date(time.getTime() + 10 * 60 * 1000)

		return t.toISOString();
	}


	const clearOptions = () => {
		setStartAddress('')
		setDestinationAddress('')
		setStartLat(null)
		setStartLong(null)
		setDestinationLat(null)
		setDestinationLong(null)
		setApiResponse(null)
		setSelectedRouteIndex(0)
		setLoading(false)
		startInputRef.current?.clear()
		destinationInputRef.current?.clear()
	}

	const requestLocationPermission = async () => {
		const { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			Alert.alert("Permission Denied", "Enable location permissions to continue.");
			return false;
		}
		return true;
	};


	const reverseGeocode = async (latitude: number, longitude: number) => {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${Config.GOOGLE_API_KEY}`;

		try {
			const response = await fetch(url);
			const data = await response.json();
			if (data.status === "OK" && data.results.length > 0) {
				console.log(data.results[0].formatted_address)
				setStartAddress(data.results[0].formatted_address);
			} else {
				Alert.alert("Error", "Failed to get address");
			}
		} catch (error) {
			console.error("Geocoding Error:", error);
			Alert.alert("Error", "Failed to fetch address");
		}
	};

	const getLocation = async () => {
		const hasPermission = await requestLocationPermission()
		if (!hasPermission) return
		const position = await Location.getCurrentPositionAsync({})
		setStartLat(position.coords.latitude)
		setStartLong(position.coords.longitude)
		await reverseGeocode(position.coords.latitude, position.coords.longitude)
	}

	const getRoutes = async () => {
		if (!startLat || !startLong || !destinationLat || !destinationLong) {
			alert("Please select valid addresses before searching for routes.");
			return;
		}

		setLoading(true);
		try {
			console.log("Start Coords:", startLat, startLong);
			console.log("Destination Coords:", destinationLat, destinationLong);

			if (!selectedDate) {
				console.error("date is not found")
			}

			if (!selectedTime) {
				console.error("time is not found")
			}
			const googleTime = toGoogleTime(selectedDate, selectedTime);


			const response = await axios.get(
				`${baseUrl}/api/getRoutes?startLat=${startLat}&startLong=${startLong}&destinationLat=${destinationLat}&destinationLong=${destinationLong}&startTime=${selectedTime}&startDate=${selectedDate}&googleTime=${googleTime}`
			);
			
			setApiResponse({
				...response.data,
				mapData: response.data.mapData ?? response.data.routes,
			})

			Animated.timing(summaryAnim, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true,
			}).start()
			setSelectedRouteIndex(0)

		} catch (error) {
			console.error("Error fetching route data:", error);
			setApiResponse(null);
			summaryAnim.setValue(0);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getLocation()
	}, [])

	useEffect(() => {
		if (apiResponse?.mapData) {
			let allCoordinates: string | any[] | undefined = []
			const selected = apiResponse.mapData[selectedRouteIndex]
			if (selected?.polyline) {
				allCoordinates = decodePolyline(selected.polyline)
			}
			if (mapRef.current && allCoordinates.length > 0) {
				mapRef.current.fitToCoordinates(allCoordinates, {
					edgePadding: { top: 30, bottom: 180, left: 30, right: 30 },
					animated: true,
				})
			}
		}
	}, [apiResponse, selectedRouteIndex])

	if (showSplash) {
		return <SplashScreen onFinish={() => setShowSplash(false)} />
	}

	return (
		<View style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.mapContainer}>
					<MapView
						ref={mapRef}
						style={StyleSheet.absoluteFillObject}
						initialRegion={{
							latitude: startLat || 42.7296,
							longitude: startLong || -73.6779,
							latitudeDelta: 0.01,
							longitudeDelta: 0.01,
						}}
					>
						{apiResponse?.mapData && apiResponse.mapData[selectedRouteIndex] && (
							<React.Fragment>
								<Polyline
									coordinates={decodePolyline(apiResponse.mapData[selectedRouteIndex].polyline)}
									strokeWidth={4}
									strokeColor={routeColors[selectedRouteIndex % routeColors.length]}
								/>
								{(() => {
									const decoded = decodePolyline(apiResponse.mapData[selectedRouteIndex].polyline)
									return (
										<>
											{decoded.length > 0 && (
												<>
													<Marker coordinate={decoded[0]} pinColor="green" />
													<Marker coordinate={decoded[decoded.length - 1]} pinColor="red" />
												</>
											)}
										</>
									)
								})()}
							</React.Fragment>
						)}
					</MapView>
				</View>
				{!apiResponse && (
					<View style={[styles.overlayContainer, { top: 0 }]}>
						<View style={styles.inputsContainer}>
							<Animated.View
								style={{
									opacity: slideAnim,
									transform: [
										{
											translateY: slideAnim.interpolate({
												inputRange: [0, 1],
												outputRange: [-20, 0],
											}),
										},
									],
								}}
							>
								{showStartInput && (
									<SafeAreaView style={{ top: insets.top - 80 }}>
										<View style={[styles.inputWrapper, { marginBottom: 8 }]}>
											<LocationInput
												placeholder={startAddress || 'Enter starting address'}
												setAddress={setStartAddress}
												setLat={setStartLat}
												setLong={setStartLong}
												inputRef={startInputRef}
												header=""
											/>
										</View>
									</SafeAreaView>
								)}
							</Animated.View>
							<SafeAreaView style={{ top: insets.top - 80 }}>
								<View style={styles.inputWrapper}>
									<LocationInput
										placeholder="Enter destination address"
										setAddress={setDestinationAddress}
										setLat={setDestinationLat}
										setLong={setDestinationLong}
										inputRef={destinationInputRef}
										header=""
									/>
								</View>
							</SafeAreaView>
						</View>

						<View style={styles.routeButtonRow}>
							<TouchableOpacity style={styles.button} onPress={getRoutes}>
								<Text style={styles.buttonText}>Find Routes</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.button} onPress={clearOptions}>
								<Text style={styles.buttonText}>Clear</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}

				<View style={styles.fixedInfoContainer}>
					{!apiResponse ? (
						<View style={styles.infoCard}>
							<View style={styles.locationRow}>
								<Text style={styles.locationTitle}>Troy, NY</Text>
								<View style={[styles.changeStartButton, { width: 150 }]}>
									<Button
										title={isChangingStart ? 'Cancel' : 'Change Start'}
										onPress={toggleChangeStart}
										color="#fff"
									/>
								</View>
								<View style={styles.changeStartButton}>
									<Button
										title="Change Time"
										onPress={() => setShowTimePicker(true)}
										color="#fff"
									/>
								</View>
							</View>
							<Text style={styles.weatherInfo}>60Â° Mostly Clear</Text>
							<Text style={styles.alertTitle}>Severe Weather Alerts</Text>
							<Text style={styles.alertSubtitle}>Wind Advisory, Troy, NY</Text>
							<View style={styles.weatherAlertsButton}>
								<Button
									title="Weather Alerts"
									onPress={() => router.push('/settings')}
									color="#fff"
								/>
							</View>
						</View>
					) : (
						<Animated.View
							style={{
								transform: [
									{
										translateY: summaryAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [300, 0], // slide up from bottom
										}),
									},
								],
							}}
						>
							<RouteSummaryCard
								start={startAddress}
								destination={destinationAddress}
								arrival={'11:45 PM'}
								weatherStats={[
									{ label: 'Rainfall', value: '20%' },
									{ label: 'Snowfall', value: '0%' },
									{ label: 'After sunset', value: '60%' },
								]}
								onStartTrip={() => console.log('Start Trip')}
								onCancel={() => {
									summaryAnim.setValue(0) // reset animation
									setApiResponse(null)
								}}
								routes={apiResponse.mapData}
								selectedRouteIndex={selectedRouteIndex}
								setSelectedRouteIndex={setSelectedRouteIndex}
								routeColors={routeColors}
								currentTime={selectedTime}
							/>
						</Animated.View>
					)}
				</View>

				<DateTimeSelector
					visible={showTimePicker}
					onClose={() => setShowTimePicker(false)}
					onConfirm={(date, time) => {
						setSelectedDate(date)
						setSelectedTime(time)
						setShowTimePicker(false)
					}}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#fff',
	},
	container: {
		flex: 1,
		flexDirection: 'column',
	},
	mapContainer: {
		flex: 1,
	},
	inputsOverlay: {
		position: 'absolute',
		top: 40,
		left: 16,
		right: 16,
		zIndex: 1,
		borderRadius: 16,
	},
	overlayContainer: {
		position: 'absolute',
		left: 16,
		right: 16,
		zIndex: 1,
	},
	inputsContainer: {
		flexDirection: 'column',
		padding: 0,
		margin: 0,
		borderRadius: 16,
	},
	inputWrapper: {
		backgroundColor: 'transparent',
		paddingVertical: 10,
		paddingHorizontal: 10,
		borderRadius: 16,
		marginBottom: 0,
		elevation: 3,
	},
	routeButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 10,
		backgroundColor: '#007bff',
		borderRadius: 16,
		padding: 10,
	},
	button: {
		flex: 1,
		backgroundColor: '#007bff',
		paddingVertical: 10,
		marginHorizontal: 5,
		borderRadius: 16,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	fixedInfoContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 2,
		borderRadius: 16,
	},
	infoCard: {
		backgroundColor: '#fff',
		width: '100%',
		padding: 16,
	},
	locationRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	locationTitle: { fontSize: 18, fontWeight: 'bold' },
	weatherInfo: { fontSize: 16, marginBottom: 8 },
	alertTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: 'red',
		marginBottom: 4,
	},
	alertSubtitle: { fontSize: 14, marginBottom: 16 },
	changeStartButton: {
		backgroundColor: '#007bff',
		borderRadius: 16,
		overflow: 'hidden',
	},
	weatherAlertsButton: {
		backgroundColor: '#007bff',
		borderRadius: 16,
		overflow: 'hidden',
		marginTop: 8,
	},
})