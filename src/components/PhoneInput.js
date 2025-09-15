import React, { useState, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import RNPhoneInput from 'react-native-phone-number-input';
import { COLORS, SIZES } from '../constants/theme';

const PhoneInput = ({ value, onChangePhone, defaultCode = 'ZA' }) => {
  const phoneInput = useRef(null);
  const [valid, setValid] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the phone input with the stored value
  useEffect(() => {
    if (value && phoneInput.current && !isInitialized) {
      console.log('Initializing phone input with value:', value);
      
      // Set the state directly on the component instance
      // This is a workaround for the library's initialization issues
      try {
        if (value.startsWith('+')) {
          // For international format, let the library handle parsing
          phoneInput.current.setNumber(value);
        } else {
          // For local format, combine with default code
          phoneInput.current.setNumber(`+27${value}`);
        }
        setIsInitialized(true);
      } catch (error) {
        console.log('Error setting phone number:', error);
      }
    }
  }, [value, isInitialized]);

  const handleChange = (formattedValue) => {
    console.log('Formatted value from library:', formattedValue);
    const checkValid = phoneInput.current?.isValidNumber(formattedValue);
    setValid(checkValid || false);
    onChangePhone(formattedValue, checkValid);
  };

  return (
    <View style={{ marginBottom: SIZES.margin }}>
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Phone Number</Text>
      <RNPhoneInput
        ref={phoneInput}
        defaultValue={""} // Start with empty to avoid conflicts
        defaultCode={defaultCode}
        layout="first"
        onChangeFormattedText={handleChange}
        containerStyle={{
          width: '100%',
          borderRadius: SIZES.radius,
          borderWidth: 1,
          borderColor: valid ? COLORS.gray500 : COLORS.error,
        }}
        textContainerStyle={{
          backgroundColor: COLORS.white,
          borderRadius: SIZES.radius,
        }}
        textInputStyle={{
          color: COLORS.gray900,
          fontSize: SIZES.medium,
        }}
        codeTextStyle={{
          color: COLORS.gray900,
          fontSize: SIZES.medium,
        }}
      />
      {!valid && value && (
        <Text style={{ color: COLORS.error, fontSize: SIZES.small, marginTop: 5 }}>
          Please enter a valid phone number
        </Text>
      )}
    </View>
  );
};

export default PhoneInput;