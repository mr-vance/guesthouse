import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';

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

export default function CreateQuoteScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    client_id: 0,
    number_of_beds: 0,
    number_of_guests: 0,
    unit_bed_cost: 0,
    unit_breakfast_cost: 0,
    unit_lunch_cost: 0,
    unit_dinner_cost: 0,
    unit_laundry_cost: 0,
    guest_details: '',
    check_in_date: '',
    check_out_date: '',
    breakfast_dates: [],
    lunch_dates: [],
    dinner_dates: [],
    laundry_dates: [],
    discount_percentage: 0,
    discount_amount: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
    document_type: 'detailed' as 'detailed' | 'summarized',
  });
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
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

  const calculateTotals = () => {
    const checkIn = new Date(form.check_in_date || '');
    const checkOut = new Date(form.check_out_date || '');
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const guests = form.number_of_guests || 0;

    const bedTotal = form.number_of_beds * nights * form.unit_bed_cost;
    const breakfastTotal = form.breakfast_dates.length * guests * form.unit_breakfast_cost;
    const lunchTotal = form.lunch_dates.length * guests * form.unit_lunch_cost;
    const dinnerTotal = form.dinner_dates.length * guests * form.unit_dinner_cost;
    const laundryTotal = form.laundry_dates.length * guests * form.unit_laundry_cost;

    const subtotal = bedTotal + breakfastTotal + lunchTotal + dinnerTotal + laundryTotal;
    const vat = subtotal * 0.15;
    const discount = form.discount_amount || (subtotal * form.discount_percentage / 100);
    const total = subtotal + vat - discount;

    setForm({ ...form, subtotal, vat, total });
  };

  const handleCreate = async () => {
    if (!form.client_id || !form.number_of_beds || !form.number_of_guests || !form.unit_bed_cost || !form.check_in_date || !form.check_out_date) {
      Alert.alert('Error', 'Required fields are missing.');
      return;
    }
    try {
      await axios.post(API_ENDPOINTS.QUOTES, form);
      Alert.alert('Success', 'Quote created successfully.');
      router.back();
    } catch (error) {
      console.error('Error creating quote:', error);
      Alert.alert('Error', 'Failed to create quote.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <ThemedText type="title">Create Quote</ThemedText>
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.client_id.toString()}
        onChangeText={text => setForm({ ...form, client_id: parseInt(text) })}
        placeholder="Client ID"
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.number_of_beds.toString()}
        onChangeText={text => {
          setForm({ ...form, number_of_beds: parseInt(text) });
          calculateTotals();
        }}
        placeholder="Number of Beds"
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.number_of_guests.toString()}
        onChangeText={text => {
          setForm({ ...form, number_of_guests: parseInt(text) });
          calculateTotals();
        }}
        placeholder="Number of Guests"
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_bed_cost.toString()}
        onChangeText={text => {
          setForm({ ...form, unit_bed_cost: parseFloat(text) });
          calculateTotals();
        }}
        placeholder="Unit Bed Cost (ZAR)"
        keyboardType="decimal-pad"
      />
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowCheckInPicker(true)}
      >
        <ThemedText>Check-in Date: {form.check_in_date || 'Select'}</ThemedText>
      </TouchableOpacity>
      <DatePicker
        modal
        open={showCheckInPicker}
        date={form.check_in_date ? new Date(form.check_in_date) : new Date()}
        onConfirm={date => {
          setShowCheckInPicker(false);
          setForm({ ...form, check_in_date: date.toISOString().split('T')[0] });
          calculateTotals();
        }}
        onCancel={() => setShowCheckInPicker(false)}
      />
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowCheckOutPicker(true)}
      >
        <ThemedText>Check-out Date: {form.check_out_date || 'Select'}</ThemedText>
      </TouchableOpacity>
      <DatePicker
        modal
        open={showCheckOutPicker}
        date={form.check_out_date ? new Date(form.check_out_date) : new Date()}
        onConfirm={date => {
          setShowCheckOutPicker(false);
          setForm({ ...form, check_out_date: date.toISOString().split('T')[0] });
          calculateTotals();
        }}
        onCancel={() => setShowCheckOutPicker(false)}
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_breakfast_cost.toString()}
        onChangeText={text => {
          setForm({ ...form, unit_breakfast_cost: parseFloat(text) });
          calculateTotals();
        }}
        placeholder="Unit Breakfast Cost (ZAR)"
        keyboardType="decimal-pad"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_lunch_cost.toString()}
        onChangeText={text => {
          setForm({ ...form, unit_lunch_cost: parseFloat(text) });
          calculateTotals();
        }}
        placeholder="Unit Lunch Cost (ZAR)"
        keyboardType="decimal-pad"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_dinner_cost.toString()}
        onChangeText={text => {
          setForm({ ...form, unit_dinner_cost: parseFloat(text) });
          calculateTotals();
        }}
        placeholder="Unit Dinner Cost (ZAR)"
        keyboardType="decimal-pad"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_laundry_cost.toString()}
        onChangeText={text => {
          setForm({ ...form, unit_laundry_cost: parseFloat(text) });
          calculateTotals();
        }}
        placeholder="Unit Laundry Cost (ZAR)"
        keyboardType="decimal-pad"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.guest_details}
        onChangeText={text => setForm({ ...form, guest_details: text })}
        placeholder="Guest Details"
        multiline
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.discount_percentage.toString()}
        onChangeText={text => {
          setForm({ ...form, discount_percentage: parseFloat(text), discount_amount: 0 });
          calculateTotals();
        }}
        placeholder="Discount Percentage"
        keyboardType="decimal-pad"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.discount_amount.toString()}
        onChangeText={text => {
          setForm({ ...form, discount_amount: parseFloat(text), discount_percentage: 0 });
          calculateTotals();
        }}
        placeholder="Discount Amount (ZAR)"
        keyboardType="decimal-pad"
      />
      <ThemedText type="subtitle">Subtotal: R{form.subtotal.toFixed(2)}</ThemedText>
      <ThemedText type="subtitle">VAT (15%): R{form.vat.toFixed(2)}</ThemedText>
      <ThemedText type="subtitle">Total: R{form.total.toFixed(2)}</ThemedText>
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
    </ScrollView>
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
  datePickerButton: {
    padding: 8,
    marginVertical: 8,
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