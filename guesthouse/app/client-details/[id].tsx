import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  phone_number: string | null;
  company_name: string | null;
  company_address: string | null;
  company_vat_number: string | null;
  company_website: string | null;
}

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchClient();
  }, []);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.CLIENTS}?id=${id}`);
      setClient(response.data);
      setForm(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
      Alert.alert('Error', 'Failed to fetch client details.');
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_ENDPOINTS.CLIENTS}?id=${id}`, form);
      setClient(form as Client);
      setIsEditing(false);
      Alert.alert('Success', 'Client updated successfully.');
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert('Error', 'Failed to update client.');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this client?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_ENDPOINTS.CLIENTS}?id=${id}`);
            router.back();
            Alert.alert('Success', 'Client deleted successfully.');
          } catch (error) {
            console.error('Error deleting client:', error);
            Alert.alert('Error', 'Failed to delete client.');
          }
        },
      },
    ]);
  };

  if (!client) return <ThemedText>Loading...</ThemedText>;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText type="title">{isEditing ? 'Edit Client' : 'Client Details'}</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.first_name}
        onChangeText={text => setForm({ ...form, first_name: text })}
        placeholder="First Name"
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.last_name || ''}
        onChangeText={text => setForm({ ...form, last_name: text })}
        placeholder="Last Name"
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.email_address}
        onChangeText={text => setForm({ ...form, email_address: text })}
        placeholder="Email Address"
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.phone_number || ''}
        onChangeText={text => setForm({ ...form, phone_number: text })}
        placeholder="Phone Number"
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_name || ''}
        onChangeText={text => setForm({ ...form, company_name: text })}
        placeholder="Company Name"
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_address || ''}
        onChangeText={text => setForm({ ...form, company_address: text })}
        placeholder="Company Address"
        multiline
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_vat_number || ''}
        onChangeText={text => setForm({ ...form, company_vat_number: text })}
        placeholder="Company VAT Number"
        editable={isEditing}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_website || ''}
        onChangeText={text => setForm({ ...form, company_website: text })}
        placeholder="Company Website"
        editable={isEditing}
      />
      <ThemedView style={styles.actions}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.light.tint }]}
              onPress={handleUpdate}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Save</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.light.icon }]}
              onPress={() => setIsEditing(false)}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.light.tint }]}
              onPress={() => setIsEditing(true)}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff4444' }]}
              onPress={handleDelete}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>Delete</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
  },
  input: {
    borderBottomWidth: 1,
    padding: 8,
    marginVertical: 8,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
});