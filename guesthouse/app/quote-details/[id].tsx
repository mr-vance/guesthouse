import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Quote {
  quote_id: number;
  client_id: number;
  quote_number: string;
  number_of_beds: number;
  number_of_guests: number;
  unit_bed_cost: number;
  unit_breakfast_cost: number;
  unit_lunch_cost: number;
  unit_dinner_cost: number;
  unit_laundry_cost: number;
  guest_details: string | null;
  check_in_date: string;
  check_out_date: string;
  breakfast_dates: string[];
  lunch_dates: string[];
  dinner_dates: string[];
  laundry_dates: string[];
  discount_percentage: number;
  discount_amount: number;
  subtotal: number;
  vat: number;
  total: number;
  document_type: 'detailed' | 'summarized';
  invoice_status: 'unpaid' | 'invoiced';
}

export default function QuoteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Quote>>({
    subtotal: 0,
    vat: 0,
    total: 0,
    breakfast_dates: [],
    lunch_dates: [],
    dinner_dates: [],
    laundry_dates: [],
  });
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({}, 'card');

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Quote' : 'Quote Details',
      headerBackTitle: '',
      headerBackTitleVisible: false,
    });
    fetchQuote();
  }, [navigation, isEditing]);

  const fetchQuote = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.QUOTES}?id=${id}`);
      const data = {
        ...response.data,
        total: parseFloat(response.data.total) || 0,
        subtotal: parseFloat(response.data.subtotal || '0') || 0,
        vat: parseFloat(response.data.vat || '0') || 0,
        unit_bed_cost: parseFloat(response.data.unit_bed_cost || '0') || 0,
        unit_breakfast_cost: parseFloat(response.data.unit_breakfast_cost || '0') || 0,
        unit_lunch_cost: parseFloat(response.data.unit_lunch_cost || '0') || 0,
        unit_dinner_cost: parseFloat(response.data.unit_dinner_cost || '0') || 0,
        unit_laundry_cost: parseFloat(response.data.unit_laundry_cost || '0') || 0,
        number_of_beds: parseInt(response.data.number_of_beds || '0', 10) || 0,
        number_of_guests: parseInt(response.data.number_of_guests || '0', 10) || 0,
        discount_percentage: parseFloat(response.data.discount_percentage || '0') || 0,
        discount_amount: parseFloat(response.data.discount_amount || '0') || 0,
        breakfast_dates: JSON.parse(response.data.breakfast_dates || '[]'),
        lunch_dates: JSON.parse(response.data.lunch_dates || '[]'),
        dinner_dates: JSON.parse(response.data.dinner_dates || '[]'),
        laundry_dates: JSON.parse(response.data.laundry_dates || '[]'),
      };
      console.log('Fetched quote:', data);
      setQuote(data);
      setForm(data);
      calculateTotals(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      Alert.alert('Error', 'Failed to fetch quote details.');
    }
  };

  const calculateTotals = (currentForm: Partial<Quote> = form) => {
    const checkIn = new Date(currentForm.check_in_date || new Date());
    const checkOut = new Date(currentForm.check_out_date || new Date());
    const nights = Math.max(
      1,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    );
    const guests = currentForm.number_of_guests || 0;

    const bedTotal = (currentForm.number_of_beds || 0) * nights * (currentForm.unit_bed_cost || 0);
    const breakfastTotal =
      (currentForm.breakfast_dates?.length || 0) * guests * (currentForm.unit_breakfast_cost || 0);
    const lunchTotal =
      (currentForm.lunch_dates?.length || 0) * guests * (currentForm.unit_lunch_cost || 0);
    const dinnerTotal =
      (currentForm.dinner_dates?.length || 0) * guests * (currentForm.unit_dinner_cost || 0);
    const laundryTotal =
      (currentForm.laundry_dates?.length || 0) * guests * (currentForm.unit_laundry_cost || 0);

    const subtotal = bedTotal + breakfastTotal + lunchTotal + dinnerTotal + laundryTotal;
    const vat = subtotal * 0.15;
    const discount =
      currentForm.discount_amount || (subtotal * (currentForm.discount_percentage || 0)) / 100;
    const total = subtotal + vat - discount;

    setForm({ ...currentForm, subtotal, vat, total });
  };

  const handleUpdate = async () => {
    if (
      !form.client_id ||
      !form.number_of_beds ||
      !form.number_of_guests ||
      !form.unit_bed_cost ||
      !form.check_in_date ||
      !form.check_out_date
    ) {
      Alert.alert('Error', 'Required fields are missing.');
      return;
    }
    try {
      await axios.put(`${API_ENDPOINTS.QUOTES}?id=${id}`, {
        ...form,
        breakfast_dates: form.breakfast_dates || [],
        lunch_dates: form.lunch_dates || [],
        dinner_dates: form.dinner_dates || [],
        laundry_dates: form.laundry_dates || [],
      });
      setQuote(form as Quote);
      setIsEditing(false);
      Alert.alert('Success', 'Quote updated successfully.');
    } catch (error) {
      console.error('Error updating quote:', error);
      Alert.alert('Error', 'Failed to update quote.');
    }
  };

  const handleInvoice = async () => {
    try {
      await axios.put(`${API_ENDPOINTS.QUOTES}?id=${id}`, { invoice_status: 'invoiced' });
      setQuote({ ...quote!, invoice_status: 'invoiced' });
      Alert.alert('Success', 'Quote invoiced successfully.');
    } catch (error) {
      console.error('Error invoicing quote:', error);
      Alert.alert('Error', 'Failed to invoice quote.');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_ENDPOINTS.QUOTES}?id=${id}`);
            router.back();
            Alert.alert('Success', 'Quote deleted successfully.');
          } catch (error) {
            console.error('Error deleting quote:', error);
            Alert.alert('Error', 'Failed to delete quote.');
          }
        },
      },
    ]);
  };

  if (!quote) return <ThemedText style={{ color: textColor }}>Loading...</ThemedText>;

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Client ID</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.client_id?.toString()}
          onChangeText={(text) => setForm({ ...form, client_id: parseInt(text) })}
          placeholder="Client ID"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Number of Beds</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.number_of_beds?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, number_of_beds: parseInt(text) || 0 });
            calculateTotals({ ...form, number_of_beds: parseInt(text) || 0 });
          }}
          placeholder="Number of Beds"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Number of Guests</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.number_of_guests?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, number_of_guests: parseInt(text) || 0 });
            calculateTotals({ ...form, number_of_guests: parseInt(text) || 0 });
          }}
          placeholder="Number of Guests"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Unit Bed Cost (ZAR)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.unit_bed_cost?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, unit_bed_cost: parseFloat(text) || 0 });
            calculateTotals({ ...form, unit_bed_cost: parseFloat(text) || 0 });
          }}
          placeholder="Unit Bed Cost (ZAR)"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Check-in Date</ThemedText>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => isEditing && setShowCheckInPicker(true)}
        >
          <ThemedText style={{ color: textColor }}>
            {form.check_in_date || 'Select'}
          </ThemedText>
        </TouchableOpacity>
        {showCheckInPicker && (
          <DateTimePicker
            value={form.check_in_date ? new Date(form.check_in_date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event, date) => {
              setShowCheckInPicker(Platform.OS === 'ios');
              if (date) {
                const newForm = { ...form, check_in_date: date.toISOString().split('T')[0] };
                setForm(newForm);
                calculateTotals(newForm);
              }
            }}
          />
        )}
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Check-out Date</ThemedText>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => isEditing && setShowCheckOutPicker(true)}
        >
          <ThemedText style={{ color: textColor }}>
            {form.check_out_date || 'Select'}
          </ThemedText>
        </TouchableOpacity>
        {showCheckOutPicker && (
          <DateTimePicker
            value={form.check_out_date ? new Date(form.check_out_date) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
            onChange={(event, date) => {
              setShowCheckOutPicker(Platform.OS === 'ios');
              if (date) {
                const newForm = { ...form, check_out_date: date.toISOString().split('T')[0] };
                setForm(newForm);
                calculateTotals(newForm);
              }
            }}
          />
        )}
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Unit Breakfast Cost (ZAR)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.unit_breakfast_cost?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, unit_breakfast_cost: parseFloat(text) || 0 });
            calculateTotals({ ...form, unit_breakfast_cost: parseFloat(text) || 0 });
          }}
          placeholder="Unit Breakfast Cost (ZAR)"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Unit Lunch Cost (ZAR)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.unit_lunch_cost?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, unit_lunch_cost: parseFloat(text) || 0 });
            calculateTotals({ ...form, unit_lunch_cost: parseFloat(text) || 0 });
          }}
          placeholder="Unit Lunch Cost (ZAR)"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Unit Dinner Cost (ZAR)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.unit_dinner_cost?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, unit_dinner_cost: parseFloat(text) || 0 });
            calculateTotals({ ...form, unit_dinner_cost: parseFloat(text) || 0 });
          }}
          placeholder="Unit Dinner Cost (ZAR)"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Unit Laundry Cost (ZAR)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.unit_laundry_cost?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, unit_laundry_cost: parseFloat(text) || 0 });
            calculateTotals({ ...form, unit_laundry_cost: parseFloat(text) || 0 });
          }}
          placeholder="Unit Laundry Cost (ZAR)"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Guest Details</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.guest_details || ''}
          onChangeText={(text) => setForm({ ...form, guest_details: text })}
          placeholder="Guest Details"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          multiline
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Discount Percentage</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.discount_percentage?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, discount_percentage: parseFloat(text) || 0, discount_amount: 0 });
            calculateTotals({ ...form, discount_percentage: parseFloat(text) || 0, discount_amount: 0 });
          }}
          placeholder="Discount Percentage"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Discount Amount (ZAR)</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
          value={form.discount_amount?.toString()}
          onChangeText={(text) => {
            setForm({ ...form, discount_amount: parseFloat(text) || 0, discount_percentage: 0 });
            calculateTotals({ ...form, discount_amount: parseFloat(text) || 0, discount_percentage: 0 });
          }}
          placeholder="Discount Amount (ZAR)"
          placeholderTextColor={Colors.dark.icon}
          editable={isEditing}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Subtotal</ThemedText>
        <ThemedText style={{ color: textColor }}>
          {typeof form.subtotal === 'number' ? `R${form.subtotal.toFixed(2)}` : '0.00'}
        </ThemedText>
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>VAT (15%)</ThemedText>
        <ThemedText style={{ color: textColor }}>
          {typeof form.vat === 'number' ? `R${form.vat.toFixed(2)}` : '0.00'}
        </ThemedText>
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Total</ThemedText>
        <ThemedText style={{ color: textColor }}>
          {typeof form.total === 'number' ? `R${form.total.toFixed(2)}` : '0.00'}
        </ThemedText>
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
            {quote.invoice_status !== 'invoiced' && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: Colors.light.tint }]}
                onPress={handleInvoice}
              >
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>Invoice</ThemedText>
              </TouchableOpacity>
            )}
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
  datePickerButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.light.icon,
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