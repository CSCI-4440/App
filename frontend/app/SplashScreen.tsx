/**
 * @file SplashScreen.tsx
 * @description A React Native component that displays a splash screen with an animated weather icon and a static logo image.
 * After a delay, the logo image and text fade out, and the onFinish callback is called to navigate to the main app.
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing, Text, Dimensions, Image } from 'react-native'

/**
 * @function SplashScreen
 * @description A React Native component that displays a splash screen with an animated weather icon and a static logo image.
 * @param param0 - Props for the SplashScreen component.
 * @param param0.onFinish - Callback function to be called when the splash screen animation is finished.
 * @returns
 */
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
	// Constants for screen dimensions
	const iconScale = useRef(new Animated.Value(1)).current
	const iconOpacity = useRef(new Animated.Value(1)).current
	const cloudOpacity = useRef(new Animated.Value(0)).current
	const textOpacity = useRef(new Animated.Value(0)).current
	const textTranslateY = useRef(new Animated.Value(10)).current

	// Start the animation sequence when the component mounts
	useEffect(() => {
		// Wait 1 second with weather icon
		setTimeout(() => {
			Animated.sequence([
				// Shrink + fade out weather icon
				Animated.parallel([
					Animated.timing(iconScale, {
						toValue: 0.5,
						duration: 500,
						easing: Easing.out(Easing.exp),
						useNativeDriver: true,
					}),
					Animated.timing(iconOpacity, {
						toValue: 0,
						duration: 500,
						useNativeDriver: true,
					}),
				]),
				// Fade in the static logo image
				Animated.timing(cloudOpacity, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
				// Slide in text
				Animated.parallel([
					Animated.timing(textOpacity, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(textTranslateY, {
						toValue: 0,
						duration: 600,
						useNativeDriver: true,
					}),
				]),
			]).start(() => {
				setTimeout(() => {
					// Exit splash
					Animated.parallel([
						Animated.timing(cloudOpacity, {
							toValue: 0,
							duration: 800,
							useNativeDriver: true,
						}),
						Animated.timing(textOpacity, {
							toValue: 0,
							duration: 1000,
							useNativeDriver: true,
						}),
					]).start(() => {
						onFinish()
					})
				}, 6000)
			})
		}, 3000)
	}, [])

	// Render the splash screen
	return (
		<View style={styles.container}>
			{/* Weather Icon (start state) */}
			<Animated.View
				style={[
					styles.weatherIcon,
					{
						transform: [{ scale: iconScale }],
						opacity: iconOpacity,
					},
				]}
			>
				<View style={styles.cloud}>
					<View style={styles.cloudBase} />
					<View style={styles.cloudPuff} />
				</View>
				<View style={styles.sun} />
			</Animated.View>

			{/* Static Logo Image (cloud with arrow) */}
			<Animated.View style={[styles.logoImageWrapper, { opacity: cloudOpacity }]}>
				<Image
					source={require('../assets/images/cloud-logo.png')}
					style={styles.logoImage}
					resizeMode="contain"
				/>
			</Animated.View>

			{/* STRATUS Text */}
			<Animated.Text
				style={[
					styles.title,
					{
						opacity: textOpacity,
						transform: [{ translateY: textTranslateY }],
					},
				]}
			>
				STRATUS
			</Animated.Text>

			{/* Subtext: RINER */}
			<Animated.Text
				style={[
					styles.subtext,
					{
						opacity: textOpacity,
						transform: [{ translateY: textTranslateY }],
					},
				]}
			>
				RINER
			</Animated.Text>
		</View>
	)
}

// Styles for the SplashScreen component
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0c0c0c',
		alignItems: 'center',
		justifyContent: 'center',
	},
	weatherIcon: {
		position: 'absolute',
		alignItems: 'center',
		justifyContent: 'center',
	},
	cloud: {
		position: 'relative',
		width: 90,
		height: 45,
		backgroundColor: '#ccc',
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cloudBase: {
		position: 'absolute',
		width: 90,
		height: 45,
		backgroundColor: '#ccc',
		borderRadius: 25,
		top: 0,
		left: 0,
	},
	cloudPuff: {
		position: 'absolute',
		width: 45,
		height: 45,
		backgroundColor: '#ccc',
		borderRadius: 25,
		top: -20,
		left: 20,
	},
	sun: {
		position: 'absolute',
		width: 30,
		height: 30,
		backgroundColor: '#FDB813',
		borderRadius: 15,
		top: -40,
		left: -35,
	},
	logoImageWrapper: {
		width: 200,
		height: 200,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
	},
	logoImage: {
		width: '100%',
		height: '100%',
	},
	title: {
		fontSize: 36,
		color: '#ffffff',
		letterSpacing: 5,
		fontWeight: '700',
		marginTop: 20,
	},
	subtext: {
		fontSize: 16,
		color: '#999',
		marginTop: 8,
		letterSpacing: 2,
	},
})

export default SplashScreen
