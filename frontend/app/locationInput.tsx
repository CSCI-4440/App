import React from "react";
import { View, StyleSheet } from "react-native";
import { Paragraph, TextInput } from "react-native-paper";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Config from "../config";

interface LocationInputProps {
  placeholder: string;
  header: string;
  setAddress: (address: string) => void;
  setLat: (lat: number) => void;
  setLong: (long: number) => void;
  inputRef?: any;
  style?: any;
}

const LocationInput: React.FC<LocationInputProps> = ({
  header,
  placeholder,
  setAddress,
  setLat,
  setLong,
  inputRef,
}) => {
  return (
    <View style={styles.autoCompleteContainer}>
      <Paragraph>{header}</Paragraph>
      <GooglePlacesAutocomplete
        ref={inputRef}
        placeholder={placeholder}
        onPress={(data, details = null) => {
          console.log(data);
          if (details) {
            const address = details.formatted_address;
            const { lat, lng } = details.geometry.location;
            setAddress(address);
            setLat(lat);
            setLong(lng);
            console.log(`${placeholder} Selected:`, address, lat, lng);
          } else {
            console.log("nothing");
          }
        }}
        query={{
          key: Config.GOOGLE_API_KEY,
          language: "en",
        }}
        fetchDetails={true}
        styles={{
          textInputContainer: styles.autoCompleteContainer,
          textInput: styles.input,
        }}
        textInputProps={{
          placeholderTextColor: "black",
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
    color: "black",
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
    fontSize: 16,
    paddingLeft: 10, 
    color: "black",
  },
});

export default LocationInput;