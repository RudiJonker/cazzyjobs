// src/utils/location.js
import * as Location from 'expo-location';

/**
 * Gets the user's current city using device GPS
 * @returns {Promise<string|null>} City name or null if failed
 */
export const getCityFromDeviceLocation = async () => {
  try {
    console.log("Requesting location permission...");
    
    // 1. Request location permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log("Location permission denied");
      return null;
    }

    // 2. Get current position
    console.log("Getting current location...");
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // Better battery life
    });

    // 3. Reverse geocode to get city name
    console.log("Reverse geocoding coordinates...");
    let geocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });

    const city = geocode[0]?.city;
    console.log("Detected city:", city);
    
    return city || null;
    
  } catch (error) {
    console.error("Location error:", error);
    return null;
  }
};

/**
 * Gets a sensible default city based on common South African cities
 * @returns {string} Default city name
 */
export const getDefaultCity = () => {
  const saCities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'];
  return saCities[0]; // Default to Johannesburg
};