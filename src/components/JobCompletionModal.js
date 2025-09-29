import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const JobCompletionModal = ({ visible, jobs, onRateJob, onClose }) => {
  if (!visible || jobs.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          padding: 20,
          width: '100%',
          maxHeight: '80%'
        }}>
          {/* Header */}
          <View style={{ marginBottom: 15 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: COLORS.primary,
              textAlign: 'center'
            }}>
              📋 Jobs Ready for Completion
            </Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.gray600,
              textAlign: 'center',
              marginTop: 5
            }}>
              The following jobs have reached their scheduled end time
            </Text>
          </View>

          {/* Jobs List */}
          <ScrollView style={{ maxHeight: 300 }}>
            {jobs.map((job, index) => (
              <View 
                key={job.id}
                style={{
                  backgroundColor: COLORS.gray100,
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: COLORS.primary
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.gray700,
                  marginBottom: 5
                }}>
                  {job.title}
                </Text>
                
                <Text style={{
                  fontSize: 14,
                  color: COLORS.gray600,
                  marginBottom: 3
                }}>
                  👤 Worker: {job.hired_worker?.full_name || 'Worker'}
                </Text>
                
                <Text style={{
                  fontSize: 14,
                  color: COLORS.gray600,
                  marginBottom: 10
                }}>
                  💼 {job.category} • R{job.proposed_wage}
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    padding: 12,
                    borderRadius: 6,
                    alignItems: 'center'
                  }}
                  onPress={() => onRateJob(job)}
                >
                  <Text style={{
                    color: COLORS.white,
                    fontWeight: '600',
                    fontSize: 14
                  }}>
                    Rate & Complete Job
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              alignItems: 'center',
              marginTop: 15,
              borderTopWidth: 1,
              borderTopColor: COLORS.gray300
            }}
            onPress={onClose}
          >
            <Text style={{
              color: COLORS.gray500,
              fontSize: 16
            }}>
              Complete Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default JobCompletionModal;