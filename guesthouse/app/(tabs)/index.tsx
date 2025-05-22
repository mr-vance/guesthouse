import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import axios from 'axios';
import { Image } from 'expo-image';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Stats {
  arrivalsToday: number;
  arrivalsTomorrow: number;
  departuresToday: number;
  departuresTomorrow: number;
  occupancy: { current: number; total: number };
}

export default function HomeScreen() {
  const [stats, setStats] = useState<Stats>({
    arrivalsToday: 0,
    arrivalsTomorrow: 0,
    departuresToday: 0,
    departuresTomorrow: 0,
    occupancy: { current: 0, total: 15 },
  });
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await axios.get(API_ENDPOINTS.QUOTES);
        const quotes = response.data;

        const arrivalsToday = quotes.filter(q => q.check_in_date === today).length;
        const arrivalsTomorrow = quotes.filter(q => q.check_in_date === tomorrow).length;
        const departuresToday = quotes.filter(q => q.check_out_date === today).length;
        const departuresTomorrow = quotes.filter(q => q.check_out_date === tomorrow).length;
        const currentOccupancy = quotes
          .filter(q => new Date(q.check_in_date) <= new Date() && new Date(q.check_out_date) >= new Date())
          .reduce((sum, q) => sum + q.number_of_guests, 0);

        setStats({
          arrivalsToday,
          arrivalsTomorrow,
          departuresToday,
          departuresTomorrow,
          occupancy: { current: currentOccupancy, total: 15 },
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.statsContainer}>
        <ThemedText type="title">Dashboard</ThemedText>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle">Arrivals Today</ThemedText>
          <ThemedText>{stats.arrivalsToday}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle">Arrivals Tomorrow</ThemedText>
          <ThemedText>{stats.arrivalsTomorrow}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle">Departures Today</ThemedText>
          <ThemedText>{stats.departuresToday}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle">Departures Tomorrow</ThemedText>
          <ThemedText>{stats.departuresTomorrow}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.statItem}>
          <ThemedText type="subtitle">Occupancy</ThemedText>
          <ThemedText>{`${stats.occupancy.current}/${stats.occupancy.total}`}</ThemedText>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.actionsContainer}>
        <Link href="/create-client" style={[styles.actionButton, { backgroundColor: Colors.light.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.actionText}>Create Client</ThemedText>
        </Link>
        <Link href="/create-quote" style={[styles.actionButton, { backgroundColor: Colors.light.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.actionText}>Create Quote</ThemedText>
        </Link>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    gap: 16,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});