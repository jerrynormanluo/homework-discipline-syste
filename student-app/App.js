import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { authService } from './src/services/authService';
import socketService from './src/services/socketService';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
