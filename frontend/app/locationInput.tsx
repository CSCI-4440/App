import React from "react";
import { View, StyleSheet } from "react-native";
import { Paragraph } from "react-native-paper";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

interface LocationInputProps {
  placeholder: string;
  setAddress: (address: string) => void;
  setLat: (lat: number) => void;
  setLong: (long: number) => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ placeholder, setAddress, setLat, setLong }) => {
  return (
    <View style={styles.autoCompleteContainer}>
      <Paragraph>{placeholder}</Paragraph>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        onPress={(data, details = null) => {
          if (details) {
            const address = details.formatted_address;
            const { lat, lng } = details.geometry.location;
            setAddress(address);
            setLat(lat);
            setLong(lng);
            console.log(`${placeholder} Selected:`, address, lat, lng);
          }
        }}
        query={{
          key: "AIzaSyD3aHzwZTHACytWzzE0SQMKOWeh6wrybTk",
          language: "en",
        }}
        fetchDetails={true}
        styles={{
          textInputContainer: styles.autoCompleteContainer,
          textInput: styles.input,
        }}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  autoCompleteContainer: {
    width: "100%",
    marginBottom: 0,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 5,
    fontSize: 16,
    paddingLeft: 10,
    backgroundColor: "#fff",
  },
});

export default LocationInput;