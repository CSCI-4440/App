/**
 * @file DateTimeSelector.tsx
 * @description A React Native component that allows users to select a date and time.
 * It uses a modal to display a calendar for date selection and a time picker for time selection.
 * The selected date and time are passed back to the parent component via a callback function.
 */

import React, { useState } from 'react'
import { Modal, View, StyleSheet, Text, Button, Platform } from 'react-native'
import { Calendar } from 'react-native-calendars'
import DateTimePicker from '@react-native-community/datetimepicker'

/**
 * @typedef {Object} Props
 * @description Props for the DateTimeSelector component.
 * @property {boolean} visible - Boolean indicating if the modal is visible
 * @property {() => void} onClose - Function to call when the modal is closed
 * @property {(date: string, time: Date) => void} onConfirm - Function to call when the user confirms the selection
 */
type Props = {
	visible: boolean
	onClose: () => void
	onConfirm: (date: string, time: Date) => void
}

/**
 * @function DateTimeSelector
 * @description A React Native component that allows users to select a date and time.
 * @param param0 - Props containing visibility, close function, and confirm function
 * @param param0.visible - Boolean indicating if the modal is visible
 * @param param0.onClose - Function to call when the modal is closed
 * @param param0.onConfirm - Function to call when the user confirms the selection
 * @returns
 */
const DateTimeSelector: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
	// State variables to manage selected date and time
	const [selectedDate, setSelectedDate] = useState<string>('')
	const [selectedTime, setSelectedTime] = useState<Date>(new Date())
	const [showTimePicker, setShowTimePicker] = useState<boolean>(false)

	// Handler for date selection
	const handleTimeChange = (_: any, date?: Date) => {
		if (date) setSelectedTime(date)
		if (Platform.OS !== 'ios') setShowTimePicker(false)
	}

	// Handler for confirming the selection
	const handleConfirm = () => {
		if (selectedDate || selectedTime) {
			onConfirm(selectedDate, selectedTime)
			onClose()
		}
	}

	// Render the time picker
	return (
		<Modal visible={visible} transparent animationType="slide">
			<View style={styles.overlay}>
				<View style={styles.modal}>
					<Text style={styles.title}>📅 Select Date</Text>
					<Calendar
						onDayPress={(day: { dateString: React.SetStateAction<string> }) =>
							setSelectedDate(day.dateString)
						}
						markedDates={{
							[selectedDate]: {
								selected: true,
								selectedColor: '#2196F3',
							},
						}}
					/>

					<View style={styles.timeSection}>
						<Text style={styles.title}>⏰ Select Time</Text>
						<DateTimePicker
							value={selectedTime}
							mode="time"
							is24Hour={false}
							display="default"
							onChange={handleTimeChange}
						/>
					</View>

					<View style={styles.buttonRow}>
						<Button title="Cancel" onPress={onClose} />
						<Button title="Confirm" onPress={handleConfirm} />
					</View>
				</View>
			</View>
		</Modal>
	)
}

// Styles for the DateTimeSelector component
const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: '#00000099',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modal: {
		backgroundColor: '#fff',
		borderRadius: 12,
		width: '100%',
		padding: 20,
		elevation: 5,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginVertical: 10,
	},
	timeSection: {
		marginTop: 20,
	},
	buttonRow: {
		marginTop: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
})

export default DateTimeSelector
