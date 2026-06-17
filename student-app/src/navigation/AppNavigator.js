import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import HomeworkDetailScreen from '../screens/HomeworkDetailScreen';
import FocusModeScreen from '../screens/FocusModeScreen';
import PointsScreen from '../screens/PointsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Points') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '作业' }} />
      <Tab.Screen name="Points" component={PointsScreen} options={{ tabBarLabel: '积分' }} />
      <Tab.Screen 
        name="Profile" 
        component={ProfilePlaceholder} 
        options={{ tabBarLabel: '我的' }} 
      />
    </Tab.Navigator>
  );
};

const ProfilePlaceholder = () => {
  return null; // 待实现
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: '注册' }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="HomeworkDetail" 
        component={HomeworkDetailScreen} 
        options={{ title: '作业详情' }}
      />
      <Stack.Screen 
        name="FocusMode" 
        component={FocusModeScreen} 
        options={{ 
          title: '专注模式',
          headerLeft: null, // 禁用返回键
          gestureEnabled: false, // 禁用手势返回
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
