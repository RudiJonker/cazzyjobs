// src/screens/WelcomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      {/* Logo Placeholder - Replace with your logo image later */}
      <View style={{ marginBottom: SIZES.margin * 3 }}>
        <Text style={{ fontSize: SIZES.xxLarge * 1.5, fontWeight: 'bold', color: COLORS.primary }}>
          cazzyjobs
        </Text>
        <Text style={{ fontSize: SIZES.medium, color: COLORS.gray500, textAlign: 'center', marginTop: SIZES.padding / 2 }}>
          Find casual work near you
        </Text>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          paddingVertical: SIZES.padding,
          paddingHorizontal: SIZES.padding * 2,
          borderRadius: SIZES.radius,
          width: '80%',
          alignItems: 'center',
        }}
        onPress={() => {
          navigation.navigate('SignUp'); // <- CHANGED THIS LINE
        }}
      >
        <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: '600' }}>
          Get Started
        </Text>
      </TouchableOpacity>

      {/* Footer Text with Sign In Link */}
      <View style={{ marginTop: SIZES.margin * 2, flexDirection: 'row' }}>
        <Text style={{ color: COLORS.gray500, fontSize: SIZES.small }}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Login'); // <- CHANGED THIS LINE
          }}
        >
          <Text style={{ color: COLORS.primary, fontSize: SIZES.small, fontWeight: '600' }}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;