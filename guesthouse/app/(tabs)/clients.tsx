import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Client {
  client_id: number;
  first_name: string;
  last_name: string | null;
  email_address: string;
  phone_number: string | null;
  company_name: string | null;
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
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
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    client.email_address.toLowerCase().includes(search.toLowerCase())
  );

  const renderClient = ({ item }: { item: Client }) => (
    <Link href={`/client-details/${item.client_id}`} asChild>
      <TouchableOpacity style={styles.clientItem}>
        <ThemedText type="defaultSemiBold">{`${item.first_name} ${item.last_name || ''}`}</ThemedText>
        <ThemedText>{item.email_address}</ThemedText>
        <IconSymbol name="chevron.right" size={18} color={Colors.light.icon} />
      </TouchableOpacity>
    </Link>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <TextInput
        style={[styles.searchInput, { borderColor: Colors.light.icon }]}
        placeholder="Search clients..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={item => item.client_id.toString()}
        ListEmptyComponent={<ThemedText>No clients found.</ThemedText>}
      />
      <Link href="/create-client" asChild>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors.light.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.addButtonText}>+</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    borderBottomWidth: 1,
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
});