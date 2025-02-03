import React from "react";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import useCatFact from "./fact";

export default function Index() {
  const { catFact, loading } = useCatFact();

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style = "">Hello World</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  text: {
    fontSize: 18,
    textAlign: "center",
  },
});