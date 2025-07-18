import * as React from 'react';
     import { View, Text, Image } from 'react-native';
     import { Button } from 'react-native-paper';
     import { styles } from '../../themes/styles';
     import { theme } from '../../themes/theme';

     export default function WelcomeScreen({ navigation }) {
       return (
         <View style={styles.container}>
           <Image source={require('../../assets/HandsLogo.png')} style={styles.logo} />
           <Text style={styles.title}>Welcome to CazzyJobs!</Text>
           <Text style={styles.tagline}>Short term casual jobs at your fingertips!</Text>
           <Button
             mode="contained"
             style={styles.button}
             onPress={() => navigation.navigate('Signup')}
             accessibilityLabel="Get started with CazzyJobs"
           >
             Get Started
           </Button>
         </View>
       );
     }