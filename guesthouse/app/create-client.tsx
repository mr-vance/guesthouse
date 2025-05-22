import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function CreateClientScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    company_name: '',
    company_address: '',
    company_vat_number: '',
    company_website: '',
  });
  const backgroundColor = useThemeColor({}, 'background');

  const handleCreate = async () => {
    if (!form.first_name || !form.email_address) {
      Alert.alert('Error', 'First name and email address are required.');
      return;
    }
    try {
      await axios.post(API_ENDPOINTS.CLIENTS, form);
      Alert.alert('Success', 'Client created successfully.');
      router.back();
    } catch (error) {
      console.error('Error creating client:', error);
      Alert.alert('Error', 'Failed to create client.');
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText type="title">Create Client</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.first_name}
        onChangeText={text => setForm({ ...form, first_name: text })}
        placeholder="First Name *"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.last_name}
        onChangeText={text => setForm({ ...form, last_name: text })}
        placeholder="Last Name"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.email_address}
        onChangeText={text => setForm({ ...form, email_address: text })}
        placeholder="Email Address *"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.phone_number}
        onChangeText={text => setForm({ ...form, phone_number: text })}
        placeholder="Phone Number"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_name}
        onChangeText={text => setForm({ ...form, company_name: text })}
        placeholder="Company Name"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_address}
        onChangeText={text => setForm({ ...form, company_address: text })}
        placeholder="Company Address"
        multiline
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_vat_number}
        onChangeText={text => setForm({ ...form, company_vat_number: text })}
        placeholder="Company VAT Number"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.company_website}
        onChangeText={text => setForm({ ...form, company_website: text })}
        placeholder="Company Website"
      />
      <ThemedView style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colors.light.tint }]}
          onPress={handleCreate}
        >
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>Create</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colors.light.icon }]}
          onPress={() => router.back()}
        >
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>Cancel</ThemedText>
        </TouchableOpacity>
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