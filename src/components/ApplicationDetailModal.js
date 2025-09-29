// src/components/ApplicationDetailModal.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const ApplicationDetailModal = ({ visible, application, onClose }) => {
  if (!application) return null;

  const worker = application.workers;
  
  // Get profile picture URL if available
  const getProfileImageUrl = () => {
    if (worker?.avatar_url) {
      if (worker.avatar_url.startsWith('http')) {
        return worker.avatar_url; // Already a full URL
      } else {
        // Get public URL from Supabase storage
        const { data: { publicUrl } } = supabase.storage
          .from('profile_pic')
          .getPublicUrl(worker.avatar_url);
        return publicUrl;
      }
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding
      }}>
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: SIZES.radius,
          padding: SIZES.padding,
          width: '90%',
          maxHeight: '85%', // Slightly smaller for cleaner look
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}>
          {/* Header with Close Button */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: SIZES.margin 
          }}>
            <Text style={{ fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.gray900 }}>
              Applicant Profile
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Picture & Name */}
            <View style={{ alignItems: 'center', marginBottom: SIZES.margin }}>
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    marginBottom: SIZES.padding,
                    borderWidth: 3,
                    borderColor: COLORS.primary
                  }}
                  onError={(e) => console.log('Error loading profile image')}
                />
              ) : (
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: COLORS.gray300,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: SIZES.padding,
                  borderWidth: 3,
                  borderColor: COLORS.gray400
                }}>
                  <Ionicons name="person" size={50} color={COLORS.gray600} />
                </View>
              )}
              
              <Text style={{ fontSize: SIZES.xLarge, fontWeight: '600', color: COLORS.gray900, marginBottom: 5 }}>
                {worker?.full_name || 'Unknown Worker'}
              </Text>
              
              <Text style={{ color: COLORS.gray500, fontSize: SIZES.small }}>
                📍 {worker?.city || 'Location not specified'}
              </Text>
            </View>

           

            {/* Bio/Skills Section */}
            <View style={{ marginBottom: SIZES.margin }}>
              <Text style={{ fontWeight: '600', marginBottom: 10, color: COLORS.gray900, fontSize: SIZES.medium }}>
                About & Skills
              </Text>
              <View style={{
                backgroundColor: COLORS.gray50,
                padding: SIZES.padding,
                borderRadius: SIZES.radius,
                borderLeftWidth: 3,
                borderLeftColor: COLORS.primary
              }}>
                <Text style={{ color: COLORS.gray700, lineHeight: 22, fontSize: SIZES.medium }}>
                  {worker?.bio || 'This applicant hasn\'t added a bio yet. They may be new to the platform or haven\'t completed their profile.'}
                </Text>
              </View>
            </View>

            {/* Rating Section (Placeholder) */}
            <View style={{ 
              backgroundColor: '#E3F2FD', 
              padding: SIZES.padding, 
              borderRadius: SIZES.radius,
              borderLeftWidth: 3,
              borderLeftColor: '#2196F3'
            }}>
              <Text style={{ fontWeight: '600', marginBottom: 5, color: '#1565C0' }}>
                ⭐ Rating & Reviews
              </Text>
              <Text style={{ color: '#1976D2', fontSize: SIZES.small }}>
                Worker ratings will be available after job completion. This helps ensure fair and accurate reviews based on actual work experience.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ApplicationDetailModal;