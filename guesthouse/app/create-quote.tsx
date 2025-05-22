import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    client_id: '',
    number_of_beds: '',
    number_of_guests: '',
    unit_bed_cost: '',
    unit_breakfast_cost: '',
    unit_lunch_cost: '',
    unit_dinner_cost: '',
    unit_laundry_cost: '',
    guest_details: '',
    check_in_date: '',
    check_out_date: '',
    breakfast_dates: [],
    lunch_dates: [],
    dinner_dates: [],
    laundry_dates: [],
    discount_percentage: '',
    discount_amount: '',
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
    const checkIn = new Date(form.check_in_date || new Date());
    const checkOut = new Date(form.check_out_date || new Date());
    const nights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );
    const guests = parseInt(form.number_of_guests) || 0;
    const numberOfBeds = parseInt(form.number_of_beds) || 0;
    const unitBedCost = parseFloat(form.unit_bed_cost) || 0;
    const unitBreakfastCost = parseFloat(form.unit_breakfast_cost) || 0;
    const unitLunchCost = parseFloat(form.unit_lunch_cost) || 0;
    const unitDinnerCost = parseFloat(form.unit_dinner_cost) || 0;
    const unitLaundryCost = parseFloat(form.unit_laundry_cost) || 0;
    const discountPercentage = parseFloat(form.discount_percentage) || 0;
    const discountAmount = parseFloat(form.discount_amount) || 0;

    const bedTotal = numberOfBeds * nights * unitBedCost;
    const breakfastTotal = form.breakfast_dates.length * guests * unitBreakfastCost;
    const lunchTotal = form.lunch_dates.length * guests * unitLunchCost;
    const dinnerTotal = form.dinner_dates.length * guests * unitDinnerCost;
    const laundryTotal = form.laundry_dates.length * guests * unitLaundryCost;

    const subtotal = bedTotal + breakfastTotal + lunchTotal + dinnerTotal + laundryTotal;
    const vat = subtotal * 0.15;
    const discount = discountAmount || (subtotal * discountPercentage) / 100;
    const total = subtotal + vat - discount;

    setForm({ ...form, subtotal, vat, total });
  };

  const handleCreate = async () => {
    if (
      !form.client_id ||
      !form.number_of_beds ||
      !form.number_of_guests ||
      !form.unit_bed_cost ||
      !form.check_in_date ||
      !form.check_out_date
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const payload = {
      ...form,
      client_id: parseInt(form.client_id),
      number_of_beds: parseInt(form.number_of_beds),
      number_of_guests: parseInt(form.number_of_guests),
      unit_bed_cost: parseFloat(form.unit_bed_cost),
      unit_breakfast_cost: parseFloat(form.unit_breakfast_cost) || 0,
      unit_lunch_cost: parseFloat(form.unit_lunch_cost) || 0,
      unit_dinner_cost: parseFloat(form.unit_dinner_cost) || 0,
      unit_laundry_cost: parseFloat(form.unit_laundry_cost) || 0,
      discount_percentage: parseFloat(form.discount_percentage) || 0,
      discount_amount: parseFloat(form.discount_amount) || 0,
      breakfast_dates: form.breakfast_dates,
      lunch_dates: form.lunch_dates,
      dinner_dates: form.dinner_dates,
      laundry_dates: form.laundry_dates,
    };

    try {
      await axios.post(API_ENDPOINTS.QUOTES, payload);
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
        value={form.client_id}
        onChangeText={text => setForm({ ...form, client_id: text })}
        placeholder="Client ID"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.number_of_beds}
        onChangeText={text => {
          setForm({ ...form, number_of_beds: text });
          calculateTotals();
        }}
        placeholder="Number of Beds"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.number_of_guests}
        onChangeText={text => {
          setForm({ ...form, number_of_guests: text });
          calculateTotals();
        }}
        placeholder="Number of Guests"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_bed_cost}
        onChangeText={text => {
          setForm({ ...form, unit_bed_cost: text });
          calculateTotals();
        }}
        placeholder="Unit Bed Cost (ZAR)"
      />
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowCheckInPicker(true)}
      >
        <ThemedText>Check-in Date: {form.check_in_date || 'Select'}</ThemedText>
      </TouchableOpacity>
      {showCheckInPicker && (
        <DateTimePicker
          value={form.check_in_date ? new Date(form.check_in_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            setShowCheckInPicker(Platform.OS === 'ios');
            if (date) {
              setForm({ ...form, check_in_date: date.toISOString().split('T')[0] });
              calculateTotals();
            }
          }}
        />
      )}
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowCheckOutPicker(true)}
      >
        <ThemedText>Check-out Date: {form.check_out_date || 'Select'}</ThemedText>
      </TouchableOpacity>
      {showCheckOutPicker && (
        <DateTimePicker
          value={form.check_out_date ? new Date(form.check_out_date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            setShowCheckOutPicker(Platform.OS === 'ios');
            if (date) {
              setForm({ ...form, check_out_date: date.toISOString().split('T')[0] });
              calculateTotals();
            }
          }}
        />
      )}
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_breakfast_cost}
        onChangeText={text => {
          setForm({ ...form, unit_breakfast_cost: text });
          calculateTotals();
        }}
        placeholder="Unit Breakfast Cost (ZAR)"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_lunch_cost}
        onChangeText={text => {
          setForm({ ...form, unit_lunch_cost: text });
          calculateTotals();
        }}
        placeholder="Unit Lunch Cost (ZAR)"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_dinner_cost}
        onChangeText={text => {
          setForm({ ...form, unit_dinner_cost: text });
          calculateTotals();
        }}
        placeholder="Unit Dinner Cost (ZAR)"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.unit_laundry_cost}
        onChangeText={text => {
          setForm({ ...form, unit_laundry_cost: text });
          calculateTotals();
        }}
        placeholder="Unit Laundry Cost (ZAR)"
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
        value={form.discount_percentage}
        onChangeText={text => {
          setForm({ ...form, discount_percentage: text, discount_amount: '' });
          calculateTotals();
        }}
        placeholder="Discount Percentage"
      />
      <TextInput
        style={[styles.input, { borderColor: Colors.light.icon }]}
        value={form.discount_amount}
        onChangeText={text => {
          setForm({ ...form, discount_amount: text, discount_percentage: '' });
          calculateTotals();
        }}
        placeholder="Discount Amount (ZAR)"
      />
      <ThemedText type="subtitle">
        Subtotal: {typeof form.subtotal === 'number' ? `R${form.subtotal.toFixed(2)}` : '0.00'}
      </ThemedText>
      <ThemedText type="subtitle">
        VAT (15%): {typeof form.vat === 'number' ? `R${form.vat.toFixed(2)}` : '0.00'}
      </ThemedText>
      <ThemedText type="subtitle">
        Total: {typeof form.total === 'number' ? `R${form.total.toFixed(2)}` : '0.00'}
      </ThemedText>
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