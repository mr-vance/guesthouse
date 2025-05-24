import { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
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
  email_address: string;
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({}, 'card');

  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CLIENTS);
      console.log('Clients API response:', response.data);
      const fetchedClients = response.data.map((client: any) => ({
        client_id: client.client_id,
        first_name: client.first_name,
        last_name: client.last_name || null,
        email_address: client.email_address || '',
      }));
      setClients(fetchedClients);
      setFilteredClients(fetchedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setFilteredClients([]);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [fetchClients])
  );

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredClients(
      clients.filter(
        (client) =>
          client.first_name.toLowerCase().includes(lowerSearch) ||
          (client.last_name && client.last_name.toLowerCase().includes(lowerSearch))
      )
    );
  }, [search, clients]);

  const renderClient = ({ item }: { item: Client }) => (
    <Link href={`/client-details/${item.client_id}`} asChild>
      <TouchableOpacity style={styles.clientItem}>
        <ThemedText type="defaultSemiBold">
          {item.first_name} {item.last_name || ''}
        </ThemedText>
        <ThemedText>{item.email_address}</ThemedText>
      </TouchableOpacity>
    </Link>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <TextInput
        style={[styles.searchBar, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
        value={search}
        onChangeText={setSearch}
        placeholder="Search clients..."
        placeholderTextColor={Colors.dark.icon}
      />
      <Link href="/create-client" asChild>
        <TouchableOpacity style={styles.addButton}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>Add Client</ThemedText>
        </TouchableOpacity>
      </Link>
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.client_id.toString()}
        ListEmptyComponent={<ThemedText>No clients found.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
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