// src/components/PhoneInput.js
import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import RNPhoneInput from 'react-native-phone-number-input';
import { COLORS, SIZES } from '../constants/theme';

const PhoneInput = ({ value, onChangePhone, defaultCode = 'ZA' }) => {
  const phoneInput = useRef(null);
  const [valid, setValid] = useState(true);

  const handleChange = (formattedValue) => {
    const checkValid = phoneInput.current?.isValidNumber(formattedValue);
    setValid(checkValid || false);
    onChangePhone(formattedValue, checkValid);
  };

  return (
    <View style={{ marginBottom: SIZES.margin }}>
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Phone Number</Text>
      <RNPhoneInput
        ref={phoneInput}
        defaultValue={value}
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