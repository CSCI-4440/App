/**
 * @file _layout.tsx
 * @description This file defines the root layout for the Expo Router application.
 * It uses the Stack component from 'expo-router' to manage navigation and screen options.
 */

import { Stack } from 'expo-router'

export default function RootLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false, // hides all headers
			}}
		></Stack>
	)
}
