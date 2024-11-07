import { Stack } from 'expo-router/stack';
import { MD3DarkTheme, MD3LightTheme, PaperProvider, useTheme } from 'react-native-paper';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import PaperTheme from '@/components/PaperTheme';
import PeripheralsProvider from '@/contexts/PeripheralsContext';

export default function Layout() {
  const paperTheme = PaperTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <PeripheralsProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </PeripheralsProvider>
    </PaperProvider >
  );
}
