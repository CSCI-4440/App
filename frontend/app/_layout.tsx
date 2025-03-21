import { Stack } from "expo-router";

export default function RootLayout() {
  return(
    <Stack
      screenOptions={{
          headerShown: false, // hides all headers
        }}>
    </Stack>
  );
}
