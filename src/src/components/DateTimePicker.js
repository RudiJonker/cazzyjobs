// src/components/DateTimePicker.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { COLORS, SIZES } from '../constants/theme';

const CustomDateTimePicker = ({ 
  label, 
  value, 
  onChange, 
  mode = 'datetime',
  minimumDate 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleConfirm = (selectedValue) => {
    onChange(selectedValue);
    setIsVisible(false);
  };

  const formatDisplay = () => {
    if (!value) return 'Select date/time';
    
    if (mode === 'date') {
      return value.toLocaleDateString();
    } else if (mode === 'time') {
      return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return value.toLocaleString();
  };

  return (
    <View style={{ marginBottom: SIZES.margin }}>
      <Text style={{ color: COLORS.gray700, marginBottom: 5 }}>{label}</Text>
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: COLORS.gray500,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          backgroundColor: COLORS.white
        }}
        onPress={() => setIsVisible(true)}
      >
        <Text style={{ color: value ? COLORS.gray900 : COLORS.gray500 }}>
          {formatDisplay()}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isVisible}
        mode={mode}
        date={value || new Date()}
        minimumDate={minimumDate}
        onConfirm={handleConfirm}
        onCancel={() => setIsVisible(false)}
      />
    </View>
  );
};

export default CustomDateTimePicker;