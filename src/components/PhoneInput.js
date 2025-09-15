// src/components/PhoneInput.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { getCachedCountryCallingCode } from '../utils/countryCodes';

const PhoneInput = ({ value, onChangePhone, countryCode = 'ZA' }) => {
  const [localNumber, setLocalNumber] = useState('');
  const [valid, setValid] = useState(true);
  const [callingCode, setCallingCode] = useState('+27');
  const [loadingCode, setLoadingCode] = useState(true);

  // Load country calling code
  useEffect(() => {
    const loadCallingCode = async () => {
      try {
        setLoadingCode(true);
        const code = await getCachedCountryCallingCode(countryCode);
        setCallingCode(code);
      } catch (error) {
        console.error('Error loading calling code:', error);
        setCallingCode('+27');
      } finally {
        setLoadingCode(false);
      }
    };

    loadCallingCode();
  }, [countryCode]);

  // Extract local part from stored international number
  useEffect(() => {
    if (value && callingCode) {
      console.log('Raw phone value from props:', value);
      
      if (value.startsWith(callingCode)) {
        const localPart = value.substring(callingCode.length);
        setLocalNumber(localPart);
      } else {
        setLocalNumber(value); // Fallback
      }
    }
  }, [value, callingCode]);

  const handleChange = (text) => {
    // Remove any non-digit characters
    const digitsOnly = text.replace(/\D/g, '');
    setLocalNumber(digitsOnly);
    
    // Basic validation
    const isValid = digitsOnly.length >= 7; // Minimum reasonable length
    setValid(isValid);
    
    // Format for storage: country code + local number
    const formattedNumber = `${callingCode}${digitsOnly}`;
    
    console.log('Formatted phone number:', formattedNumber);
    onChangePhone(formattedNumber, isValid);
  };

  return (
    <View style={{ marginBottom: SIZES.margin }}>
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>Phone Number</Text>
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: valid ? COLORS.gray500 : COLORS.error,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.white,
      }}>
        {loadingCode ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: SIZES.padding }} />
        ) : (
          <Text style={{ 
            padding: SIZES.padding,
            color: COLORS.gray700,
            fontWeight: '600'
          }}>
            {callingCode}
          </Text>
        )}
        
        <TextInput
          style={{
            flex: 1,
            padding: SIZES.padding,
            color: COLORS.gray900,
            fontSize: SIZES.medium,
          }}
          placeholder="Enter your phone number"
          value={localNumber}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>
      
      {!valid && localNumber && (
        <Text style={{ color: COLORS.error, fontSize: SIZES.small, marginTop: 5 }}>
          Please enter a valid phone number
        </Text>
      )}
    </View>
  );
};

export default PhoneInput;