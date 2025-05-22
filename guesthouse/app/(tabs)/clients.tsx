import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string | null;
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CLIENTS);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const renderClient = ({ item }: { item: Client }) => (
    <Link href={`/client-details/${item.client_id}`} asChild>
      <TouchableOpacity style={styles.clientItem}>
        <ThemedText type="defaultSemiBold">
          {item.first_name} {item.last_name || ''}
        </ThemedText>
        <ThemedText>Client ID: {item.client_id}</ThemedText>
      </TouchableOpacity>
    </Link>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText type="title">Clients</ThemedText>
      <Link href="/create-client" asChild>
        <TouchableOpacity style={styles.addButton}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>Add Client</ThemedText>
        </TouchableOpacity>
      </Link>
      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={item => item.client_id.toString()}
        ListEmptyComponent={<ThemedText>No clients found.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // Increased to avoid status bar overlap
  },
  clientItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
  },
});