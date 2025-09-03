import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const JobCard = ({ job, onPress }) => {
  // Helper function to format how long ago the job was posted
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const postedDate = new Date(dateString);
    const hoursAgo = Math.floor((now - postedDate) / (1000 * 60 * 60));
    
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    return `${Math.floor(hoursAgo / 24)}d ago`;
  };

  return (
    <TouchableOpacity 
      style={{
        backgroundColor: COLORS.white,
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: SIZES.large, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 5 }}>
        {job.title}
      </Text>
      <Text style={{ color: COLORS.primary, fontWeight: '600', marginBottom: 5 }}>
        R{job.proposed_wage}
      </Text>
      <Text style={{ color: COLORS.gray500, fontSize: SIZES.small }}>
        {job.category} • {job.job_city} • {getTimeAgo(job.created_at)}
      </Text>
    </TouchableOpacity>
  );
};

export default JobCard;