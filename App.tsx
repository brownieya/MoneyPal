import React, { useEffect } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { initDB } from './src/database/db';
import {
  consumePendingNotifications,
  listenToNotifications,
} from './src/modules/notificationListener';
import { useTransactionStore } from './src/store/useTransactionStore';
import AddScreen from './src/screens/AddScreen';
import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import { colors, radius, shadows } from './src/theme/tokens';

enableScreens();

const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
};

const TAB_ICONS = {
  Home: ['home-outline', 'home'],
  Add: ['add-circle-outline', 'add-circle'],
  Stats: ['stats-chart-outline', 'stats-chart'],
} as const;

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
      <StatusBar style="dark" />
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarShowLabel: true,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarStyle: styles.tabBar,
            tabBarItemStyle: styles.tabBarItem,
            tabBarIcon: ({ color, focused }) => {
              const routeName = route.name as keyof typeof TAB_ICONS;
              const iconName = focused ? TAB_ICONS[routeName][1] : TAB_ICONS[routeName][0];

              return (
                <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
                  <Ionicons name={iconName} size={route.name === 'Add' ? 24 : 22} color={color} />
                </View>
              );
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '首页',
            }}
          />
          <Tab.Screen
            name="Add"
            component={AddScreen}
            options={{
              title: '记一笔',
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              title: '统计',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.select({ ios: 84, default: 68 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 22, default: 10 }),
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    ...shadows,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  tabIconWrapActive: {
    backgroundColor: colors.primaryMuted,
  },
});
