import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="client-details/[id]"
        options={{
          title: 'Client Details',
          headerBackTitle: '',
          headerBackTitleVisible: false, // Hide back label entirely
        }}
      />
      <Stack.Screen
        name="quote-details/[id]"
        options={{
          title: 'Quote Details',
          headerBackTitle: '',
          headerBackTitleVisible: false, // Hide back label entirely
        }}
      />
      <Stack.Screen name="create-client" options={{ title: 'Create Client' }} />
      <Stack.Screen name="create-quote" options={{ title: 'Create Quote' }} />
    </Stack>
  );
}