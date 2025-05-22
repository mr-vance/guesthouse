import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
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
  email: string | null;
  phone: string | null;
}

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({}, 'card');

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Client' : 'Client Details',
      headerBackTitle: '',
      headerBackTitleVisible: false,
    });
    fetchClient();
  }, [navigation, isEditing]);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.CLIENTS}?id=${id}`);
      console.log('Client details API response:', response.data);
      const data = response.data;
      setClient(data);
      setForm(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      Alert.alert('Error', 'Failed to fetch client details.');
    }
  };

  const handleUpdate = async () => {
    if (!form.first_name) {
      Alert.alert('Error', 'First name is required.');
      return;
    }
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

  if (!client) return <ThemedText style={{ color: textColor }}>Loading...</ThemedText>;

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>First Name</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.first_name || ''}
          onChangeText={(text) => setForm({ ...form, first_name: text })}
          placeholder="First Name"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Last Name</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.last_name || ''}
          onChangeText={(text) => setForm({ ...form, last_name: text })}
          placeholder="Last Name"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Email</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.email || ''}
          onChangeText={(text) => setForm({ ...form, email: text })}
          placeholder="Email"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Phone</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.phone || ''}
          onChangeText={(text) => setForm({ ...form, phone: text })}
          placeholder="Phone"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
        />
      </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  fieldContainer: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 16,
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