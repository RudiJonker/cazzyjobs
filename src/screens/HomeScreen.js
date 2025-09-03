import { View, Text, FlatList, RefreshControl } from 'react-native';
import { globalStyles } from '../constants/styles';
import { COLORS, SIZES } from '../constants/theme';
import JobCard from '../components/JobCard';

// Temporary mock data - we'll replace with real data later
const mockJobs = [
  {
    id: '1',
    title: 'Help move furniture',
    proposed_wage: 150,
    category: 'Moving',
    job_city: 'Pretoria',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '2', 
    title: 'Garden cleaning and weeding',
    proposed_wage: 200,
    category: 'Gardening',
    job_city: 'Johannesburg',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: '3',
    title: 'House cleaning for party',
    proposed_wage: 300,
    category: 'Cleaning',
    job_city: 'Cape Town',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

const HomeScreen = () => {
  const handleJobPress = (job) => {
    console.log('Job pressed:', job.title);
    // We'll navigate to JobDetailScreen later
  };

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.margin }}>
        <Text style={{ fontSize: SIZES.xLarge, fontWeight: 'bold', color: COLORS.primary }}>cazzyjobs</Text>
        <View style={{ padding: 5, backgroundColor: COLORS.gray100, borderRadius: SIZES.radius }}>
          <Text style={{ color: COLORS.gray700, fontSize: SIZES.small }}>🌤️ 24°C</Text>
        </View>
      </View>

      {/* Search Bar (Placeholder) */}
      <View style={{ 
        backgroundColor: COLORS.gray100, 
        padding: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.margin 
      }}>
        <Text style={{ color: COLORS.gray500 }}>🔍 Search for gardening, cleaning, building jobs...</Text>
      </View>

      {/* Jobs List */}
      <FlatList
        data={mockJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard 
            job={item} 
            onPress={() => handleJobPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => console.log('Refreshing...')}
          />
        }
      />
    </View>
  );
};

export default HomeScreen;