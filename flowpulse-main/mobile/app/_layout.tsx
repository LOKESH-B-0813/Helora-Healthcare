import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { RealtimeHospitalProvider } from '../hooks/useRealtimeHospital'
import { THEME } from '../lib/constants/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RealtimeHospitalProvider>
        <StatusBar style="dark" backgroundColor={THEME.colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: THEME.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="appointment/book"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="appointment/confirmation"
            options={{
              presentation: 'card',
              headerShown: false,
            }}
          />
        </Stack>
      </RealtimeHospitalProvider>
    </SafeAreaProvider>
  )
}
