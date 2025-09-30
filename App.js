import './globals.js';
import 'intl-pluralrules';
import './src/language/i18n';
import { useEffect } from 'react';
import { UserProvider } from './src/hooks/MyProvider';
import AppNavigator from './src/base/AppNavigator.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
// import 'i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      cacheTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Disable refetch on window focus for React Native
    },
  },
});

export default function App() {
  return (
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
      </QueryClientProvider>
      <Toast />
    </UserProvider>
  );
}

// "keystore":{
//   "keystorePath":"/Users/simkeep/RN/Metalet/metalet.jks",
//   "keystorePassword": "123456",
//   "keyAlias": "key0",
//   "keyPassword": "123456"
// }
