/**
 * @file LocationInput.tsx
 * @description A React Native component that provides an input field for users to enter a location.
 * It uses the Google Places API to provide autocomplete suggestions for locations.
 * The selected location's address, latitude, and longitude are passed back to the parent component via callback functions.
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Paragraph, TextInput } from 'react-native-paper'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import Config from '../config'

/**
 * @interface LocationInputProps
 * @description Props for the LocationInput component.
 * @property {string} placeholder - Placeholder text for the input field.
 * @property {string} header - Header text for the input field.
 * @property {(address: string) => void} setAddress - Callback function to set the selected address.
 * @property {(lat: number) => void} setLat - Callback function to set the latitude of the selected location.
 * @property {(long: number) => void} setLong - Callback function to set the longitude of the selected location.
 * @property {any} inputRef - Reference to the input field.
 * @property {any} style - Additional styles for the input field.
 * @description The LocationInput component provides an input field for users to enter a location.
 */
interface LocationInputProps {
	placeholder: string
	header: string
	setAddress: (address: string) => void
	setLat: (lat: number) => void
	setLong: (long: number) => void
	inputRef?: any
	style?: any
}

/**
 * @function LocationInput
 * @description A React Native component that provides an input field for users to enter a location.
 * @param param0 - Props for the LocationInput component.
 * @returns {JSX.Element} - A React Native component that provides an input field for location selection.
 */
const LocationInput: React.FC<LocationInputProps> = ({
	header,
	placeholder,
	setAddress,
	setLat,
	setLong,
	inputRef,
}) => {
	// Render the Google Places Autocomplete component
	return (
		<View style={styles.autoCompleteContainer}>
			<Paragraph>{header}</Paragraph>
			<GooglePlacesAutocomplete
				ref={inputRef}
				placeholder={placeholder}
				onPress={(data, details = null) => {
					console.log(data)
					if (details) {
						const address = details.formatted_address
						const { lat, lng } = details.geometry.location
						setAddress(address)
						setLat(lat)
						setLong(lng)
						console.log(`${placeholder} Selected:`, address, lat, lng)
					} else {
						console.log('nothing')
					}
				}}
				query={{
					key: Config.GOOGLE_API_KEY,
					language: 'en',
				}}
				fetchDetails={true}
				styles={{
					textInputContainer: styles.autoCompleteContainer,
					textInput: styles.input,
				}}
				textInputProps={{
					placeholderTextColor: 'black',
				}}
			/>
		</View>
	)
}

// Styles for the LocationInput component
const styles = StyleSheet.create({
	autoCompleteContainer: {
		width: '100%',
		marginBottom: 0,
		color: 'black',
		zIndex: 1000,
	},
	input: {
		width: '100%',
		height: 50,
		borderColor: '#ddd',
		borderWidth: 1,
		borderRadius: 16,
		fontSize: 16,
		paddingLeft: 10,
		color: 'black',
	},
})

export default LocationInput