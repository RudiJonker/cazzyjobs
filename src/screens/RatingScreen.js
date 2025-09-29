import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import { supabase } from '../lib/supabase';

const RatingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { job, worker } = route.params;
  
  const [rating, setRating] = useState(0);
  const [tempRating, setTempRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Star rating component
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = (tempRating || rating) >= i;
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          onPressIn={() => setTempRating(i)}
          onPressOut={() => setTempRating(0)}
          style={{ marginHorizontal: 6 }}
        >
          <Text style={{ 
            fontSize: 32,
            color: isFilled ? '#FFD700' : '#CCCCCC'
          }}>
            {isFilled ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingDescription = (rating) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  const handleFinalizeJob = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before finalizing the job.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update the job status to 'completed' and set the rating
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_rating: rating
        })
        .eq('id', job.id);

      if (jobError) throw jobError;

      // 2. Update the worker's average rating
      const { data: workerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('average_rating, total_ratings')
        .eq('id', worker.id)
        .single();

      if (profileError) throw profileError;

      const currentTotalRatings = workerProfile.total_ratings || 0;
      const currentAverage = workerProfile.average_rating || 0;
      
      // Calculate new average
      const newTotalRatings = currentTotalRatings + 1;
      const newAverage = ((currentAverage * currentTotalRatings) + rating) / newTotalRatings;

      // Update worker's profile with new rating
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          average_rating: Math.round(newAverage * 10) / 10,
          total_ratings: newTotalRatings
        })
        .eq('id', worker.id);

      if (updateError) throw updateError;

      // 3. Update the application status to 'completed'
      const { error: applicationError } = await supabase
        .from('applications')
        .update({ status: 'completed' })
        .eq('job_id', job.id)
        .eq('worker_id', worker.id)
        .eq('status', 'hired');

      if (applicationError) throw applicationError;

      // Success!
      Alert.alert(
        'Job Completed!',
        `You rated ${worker.full_name} ${rating} stars. Thank you for using CazzyJobs!`,
        [
          {
            text: 'Back to Home',
            onPress: () => navigation.navigate('MainTabs')
          }
        ]
      );

    } catch (error) {
      console.error('Error finalizing job:', error);
      Alert.alert('Error', 'Failed to complete the job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Go Back?',
      'Are you sure you want to go back? You can complete this rating later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Go Back', 
          onPress: () => navigation.goBack() 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.gray100 }}>
      <ScrollView 
        style={globalStyles.container}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra space for phone buttons
        showsVerticalScrollIndicator={false}
      >
        {/* Header with proper spacing */}
        <View style={{ 
          marginBottom: 30,
          marginTop: 20,
          paddingTop: 10
        }}>
          <Text style={globalStyles.screenHeader}>Rate Worker</Text>
          <Text style={{ color: COLORS.gray600, fontSize: SIZES.medium }}>
            Please rate the work completed for:
          </Text>
          <Text style={{ 
            fontSize: SIZES.large, 
            fontWeight: '600', 
            color: COLORS.primary,
            marginTop: 5 
          }}>
            {job.title}
          </Text>
        </View>

        {/* Worker Info */}
        <View style={{ 
          backgroundColor: COLORS.white, 
          padding: 16,
          borderRadius: 8,
          marginBottom: 25,
          borderWidth: 1,
          borderColor: COLORS.gray300
        }}>
          <Text style={{ 
            fontSize: SIZES.medium, 
            fontWeight: '600', 
            marginBottom: 8,
            color: COLORS.gray700 
          }}>
            Worker Details
          </Text>
          <Text style={{ color: COLORS.gray600, marginBottom: 4 }}>
            👤 {worker.full_name || 'Worker'}
          </Text>
          <Text style={{ color: COLORS.gray600 }}>
            💼 {job.category} • R{job.proposed_wage}
          </Text>
        </View>

        {/* Rating Section */}
        <View style={{ 
          backgroundColor: COLORS.white, 
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: COLORS.gray300
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginBottom: 20,
            textAlign: 'center',
            color: COLORS.gray700 
          }}>
            How was the work quality?
          </Text>

          {/* Star Rating */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            marginBottom: 20
          }}>
            {renderStars()}
          </View>

          {/* Rating Description */}
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 16,
            color: rating > 0 ? COLORS.primary : COLORS.gray500,
            fontWeight: rating > 0 ? '600' : '400',
            marginBottom: 15 
          }}>
            {getRatingDescription(rating)}
          </Text>

          {/* Selected Rating Display */}
          {rating > 0 && (
            <View style={{ 
              alignItems: 'center', 
              marginBottom: 15,
              padding: 10,
              backgroundColor: COLORS.gray100,
              borderRadius: 8
            }}>
              <Text style={{ 
                fontSize: 16, 
                color: COLORS.primary,
                fontWeight: '600'
              }}>
                Selected: {rating} {rating === 1 ? 'star' : 'stars'}
              </Text>
            </View>
          )}

          {/* Rating Guidelines */}
          <View style={{ 
            backgroundColor: COLORS.gray100, 
            padding: 12,
            borderRadius: 8 
          }}>
            <Text style={{ 
              fontSize: 14, 
              color: COLORS.gray600,
              textAlign: 'center'
            }}>
              1★ = Poor • 2★ = Fair • 3★ = Good • 4★ = Very Good • 5★ = Excellent
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ marginBottom: 15 }}>
          {/* Finalize Button */}
          <TouchableOpacity
            style={[
              globalStyles.button,
              { 
                backgroundColor: rating > 0 ? COLORS.primary : COLORS.gray400,
                opacity: loading ? 0.6 : 1
              }
            ]}
            onPress={handleFinalizeJob}
            disabled={loading || rating === 0}
          >
            <Text style={globalStyles.buttonText}>
              {loading ? 'Finalizing...' : 'Finalize Job'}
            </Text>
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            style={{
              padding: 16,
              alignItems: 'center'
            }}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={{ 
              color: COLORS.gray500, 
              fontSize: 16
            }}>
              Complete Later
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Note Footer */}
        <View style={{ 
          backgroundColor: '#E3F2FD', 
          padding: 16,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: COLORS.primary,
          marginTop: 10,
          marginBottom: 50
        }}>
          <Text style={{ 
            fontSize: 14, 
            color: COLORS.gray700,
            textAlign: 'center'
          }}>
            💡 This rating will help build {worker.full_name}'s reputation on CazzyJobs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RatingScreen;