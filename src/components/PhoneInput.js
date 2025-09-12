import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import RNPhoneInput from 'react-native-phone-number-input';
import { COLORS, SIZES } from '../constants/theme';

const PhoneInput = ({ value, onChangePhone, defaultCode = 'ZA' }) => {
  const phoneInput = useRef(null);
  const [valid, setValid] = useState(true);
  const [rawLocalNumber, setRawLocalNumber] = useState('');

  const handleChange = (localNumber) => {
    setRawLocalNumber(localNumber);

    const countryCode = phoneInput.current?.getCallingCode(); // returns numeric code like '27'
    const cleanedLocal = localNumber.replace(/\D/g, ''); // Remove non-digit characters

    const isValidLength = cleanedLocal.length === 9; // South Africa: 9 digits
    const finalValue = `+${countryCode}${cleanedLocal}`; // E.164 format

    setValid(isValidLength);
    onChangePhone(finalValue, isValidLength);
  };

  return (
    <View style={{ marginBottom: SIZES.margin }}>
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Phone Number</Text>
      <RNPhoneInput
        ref={phoneInput}
        defaultValue={rawLocalNumber}
        defaultCode={defaultCode}
        layout="first"
        onChangeText={handleChange}
        containerStyle={{
          width: '100%',
          borderRadius: SIZES.radius,
          borderWidth: 1,
          borderColor: valid ? COLORS.gray500 : COLORS.error,
          backgroundColor: COLORS.white,
        }}
        textContainerStyle={{
          backgroundColor: COLORS.white,
          borderRadius: SIZES.radius,
          paddingVertical: 0,
        }}
        textInputStyle={{
          color: COLORS.gray900,
          fontSize: SIZES.medium,
          height: 50,
          paddingTop: 12, 
          textAlignVertical: 'center',
          includeFontPadding: false,
        }}
        codeTextStyle={{
          color: COLORS.gray900,
          fontSize: SIZES.medium,
        }}
        flagButtonStyle={{
  width: 50, 
  marginRight: -10,  
}}

countryPickerButtonStyle={{
  paddingRight: -8, // 
}}
        placeholder="812345678" // South African example
        disableArrowIcon={false}
        withDarkTheme={false}
        withShadow={false}
        autoFocus={false}
      />
      {!valid && rawLocalNumber && (
        <Text style={{ color: COLORS.error, fontSize: SIZES.small, marginTop: 5 }}>
          Please enter a valid 9-digit phone number
        </Text>
      )}
    </View>
  );
};

export default PhoneInput;