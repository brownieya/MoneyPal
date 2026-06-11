import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppState, Text } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB } from './src/database/db';
import {
  consumePendingNotifications,
  listenToNotifications,
} from './src/modules/notificationListener';
import { useTransactionStore } from './src/store/useTransactionStore';

enableScreens();
import HomeScreen from './src/screens/HomeScreen';
import AddScreen from './src/screens/AddScreen';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const importNotifications = useTransactionStore(state => state.importNotifications);

  useEffect(() => {
    initDB();

    const syncNotifications = async () => {
      const pendingNotifications = await consumePendingNotifications();
      importNotifications(pendingNotifications);
    };

    void syncNotifications();

    const stopListening = listenToNotifications(notification => {
      importNotifications([notification]);
    });

    const appStateSubscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void syncNotifications();
      }
    });

    return () => {
      stopListening();
      appStateSubscription.remove();
    };
  }, [importNotifications]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#E53935',
            tabBarInactiveTintColor: '#999',
            headerStyle: { backgroundColor: '#E53935' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '账单',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
            }}
          />
          <Tab.Screen
            name="Add"
            component={AddScreen}
            options={{
              title: '记一笔',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>,
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              title: '统计',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
