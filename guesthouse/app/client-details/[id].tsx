import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Client {
  first_name: string;
  last_name: string | null;
  email_address: string;
  phone_number: string;
  company_name: string;
  company_address: string;
  company_vat_number: string;
  company_website: string;
}

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    company: true,
  });
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'card');

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
      const data = {
        first_name: response.data.first_name,
        last_name: response.data.last_name || null,
        email_address: response.data.email_address || '',
        phone_number: response.data.phone_number || '',
        company_name: response.data.company_name || '',
        company_address: response.data.company_address || '',
        company_vat_number: response.data.company_vat_number || '',
        company_website: response.data.company_website || '',
      };
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
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name || '',
        email_address: form.email_address || '',
        phone_number: form.phone_number || '',
        company_name: form.company_name || '',
        company_address: form.company_address || '',
        company_vat_number: form.company_vat_number || '',
        company_website: form.company_website || '',
      };
      await axios.put(`${API_ENDPOINTS.CLIENTS}?id=${id}`, payload);
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderField = (label: string, value: string | null, key: keyof Client, placeholder: string) => (
    <View style={styles.field}>
      <ThemedText style={[styles.fieldLabel, { color: textColor }]}>{label}</ThemedText>
      {isEditing ? (
        <TextInput
          style={[styles.input, { backgroundColor: cardBackground, color: textColor, borderColor: textColor }]}
          value={form[key]?.toString() || ''}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.icon}
        />
      ) : (
        <ThemedText style={[styles.fieldValue, { color: textColor }]}>
          {value || 'Not provided'}
        </ThemedText>
      )}
    </View>
  );

  if (!client) return <ThemedText style={{ color: textColor }}>Loading...</ThemedText>;

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      {/* Personal Info Section */}
      <View style={[styles.section, { backgroundColor: cardBackground }]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('personal')}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Personal Information</ThemedText>
          <Ionicons
            name={expandedSections.personal ? 'chevron-down' : 'chevron-forward'}
            size={24}
            color={textColor}
          />
        </TouchableOpacity>
        {expandedSections.personal && (
          <View style={styles.sectionContent}>
            {renderField('First Name', client.first_name, 'first_name', 'First Name')}
            {renderField('Last Name', client.last_name, 'last_name', 'Last Name')}
            {renderField('Email Address', client.email_address, 'email_address', 'Email Address')}
            {renderField('Phone Number', client.phone_number, 'phone_number', 'Phone Number')}
          </View>
        )}
      </View>

      {/* Company Info Section */}
      <View style={[styles.section, { backgroundColor: cardBackground }]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('company')}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Company Information</ThemedText>
          <Ionicons
            name={expandedSections.company ? 'chevron-down' : 'chevron-forward'}
            size={24}
            color={textColor}
          />
        </TouchableOpacity>
        {expandedSections.company && (
          <View style={styles.sectionContent}>
            {renderField('Company Name', client.company_name, 'company_name', 'Company Name')}
            {renderField('Company Address', client.company_address, 'company_address', 'Company Address')}
            {renderField('VAT Number', client.company_vat_number, 'company_vat_number', 'VAT Number')}
            {renderField('Website', client.company_website, 'company_website', 'Website')}
          </View>
        )}
      </View>

      {/* Actions */}
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
              onPress={() => {
                setIsEditing(false);
                setForm(client); // Reset form to original client data
              }}
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
  },
  section: {
    marginVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionContent: {
    padding: 16,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    opacity: 0.8,
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
    marginBottom: 32,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});