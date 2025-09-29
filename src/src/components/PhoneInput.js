import React, { useState, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import RNPhoneInput from 'react-native-phone-number-input';
import { COLORS, SIZES } from '../constants/theme';

const PhoneInput = ({ value, onChangePhone, defaultCode = 'ZA' }) => {
  const phoneInput = useRef(null);
  const [valid, setValid] = useState(true);
  const [localNumber, setLocalNumber] = useState('');
  const [componentKey, setComponentKey] = useState(0);

  // Extract local number from international format and force re-render
  useEffect(() => {
    if (value) {
      console.log('Raw phone value from props:', value);
      
      let extractedLocal = '';
      if (value.startsWith('+27')) {
        // Extract local number from international format: +27845275095 → 845275095
        extractedLocal = value.substring(3);
        console.log('Extracted local number:', extractedLocal);
      } else if (value.startsWith('+')) {
        // Other international formats
        const digits = value.replace(/\D/g, '');
        if (digits.length > 2) {
          extractedLocal = digits.substring(2);
        }
      } else {
        // Already local format
        extractedLocal = value;
      }
      
      setLocalNumber(extractedLocal);
      // Force re-render by changing the key
      setComponentKey(prev => prev + 1);
    }
  }, [value]);

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
        key={componentKey} // Force re-render when key changes
        ref={phoneInput}
        defaultValue={localNumber} // Pass ONLY the local part
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