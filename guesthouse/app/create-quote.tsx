import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
    breakfast_dates: [] as string[],
    lunch_dates: [] as string[],
    dinner_dates: [] as string[],
    laundry_dates: [] as string[],
    discount_percentage: '',
    discount_amount: '',
    subtotal: 0,
    vat: 0,
    total: 0,
    document_type: 'detailed' as 'detailed' | 'summarized',
  });
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showMealDatePicker, setShowMealDatePicker] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({}, 'card');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CLIENTS);
      console.log('Fetched clients:', response.data);
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const calculateTotals = () => {
    const checkIn = form.check_in_date ? new Date(form.check_in_date) : new Date();
    const checkOut = form.check_out_date ? new Date(form.check_out_date) : new Date();
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

    setForm((prev) => ({ ...prev, subtotal, vat, total }));
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

    const checkInDate = new Date(form.check_in_date);
    const checkOutDate = new Date(form.check_out_date);
    const validateDates = (dates: string[]) =>
      dates.every((date) => {
        const d = new Date(date);
        return d >= checkInDate && d <= checkOutDate;
      });

    if (
      !validateDates(form.breakfast_dates) ||
      !validateDates(form.lunch_dates) ||
      !validateDates(form.dinner_dates) ||
      !validateDates(form.laundry_dates)
    ) {
      Alert.alert('Error', 'Meal dates must be between check-in and check-out dates.');
      return;
    }

    const payload = {
      client_id: parseInt(form.client_id),
      number_of_beds: parseInt(form.number_of_beds),
      number_of_guests: parseInt(form.number_of_guests),
      unit_bed_cost: parseFloat(form.unit_bed_cost),
      unit_breakfast_cost: parseFloat(form.unit_breakfast_cost) || 0,
      unit_lunch_cost: parseFloat(form.unit_lunch_cost) || 0,
      unit_dinner_cost: parseFloat(form.unit_dinner_cost) || 0,
      unit_laundry_cost: parseFloat(form.unit_laundry_cost) || 0,
      guest_details: form.guest_details,
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
      breakfast_dates: form.breakfast_dates,
      lunch_dates: form.lunch_dates,
      dinner_dates: form.dinner_dates,
      laundry_dates: form.laundry_dates,
      discount_percentage: parseFloat(form.discount_percentage) || 0,
      discount_amount: parseFloat(form.discount_amount) || 0,
      document_type: form.document_type,
    };

    try {
      console.log('Creating quote with payload:', payload);
      await axios.post(API_ENDPOINTS.QUOTES, payload);
      Alert.alert('Success', 'Quote created successfully.');
      router.back();
    } catch (error) {
      console.error('Error creating quote:', error);
      Alert.alert('Error', 'Failed to create quote.');
    }
  };

  const handleDateChange = (type: 'check_in' | 'check_out', date: Date | undefined) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    console.log(`Selected ${type} date:`, dateString);
    setForm({
      ...form,
      [`${type}_date`]: dateString,
      ...(type === 'check_in' || type === 'check_out'
        ? { breakfast_dates: [], lunch_dates: [], dinner_dates: [], laundry_dates: [] }
        : {}),
    });
    setShowCheckInPicker(false);
    setShowCheckOutPicker(false);
    calculateTotals();
  };

  const handleMealDateChange = (mealType: 'breakfast' | 'lunch' | 'dinner', date: Date | undefined) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    console.log(`Selected ${mealType} date:`, dateString);
    const currentDates = form[`${mealType}_dates`] || [];
    const newDates = currentDates.includes(dateString)
      ? currentDates.filter((d) => d !== dateString)
      : [...currentDates, dateString].sort();
    setForm({ ...form, [`${mealType}_dates`]: newDates });
    setShowMealDatePicker(null);
    calculateTotals();
  };

  const renderMealDate = (mealType: 'breakfast' | 'lunch' | 'dinner') => ({
    item,
  }: {
    item: string;
  }) => (
    <View style={styles.dateItem}>
      <ThemedText style={{ color: textColor }}>{item}</ThemedText>
      <TouchableOpacity
        onPress={() =>
          setForm({
            ...form,
            [`${mealType}_dates`]: form[`${mealType}_dates`].filter((d) => d !== item),
          })
        }
      >
        <ThemedText style={{ color: '#ff4444' }}>Remove</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Select Client</ThemedText>
        <Picker
          selectedValue={form.client_id}
          onValueChange={(value) => setForm({ ...form, client_id: value })}
          style={[styles.picker, { backgroundColor: inputBackground, color: textColor }]}
          enabled={!form.client_id}
        >
          <Picker.Item label="Choose a client" value="" />
          {clients.map((client) => (
            <Picker.Item
              key={client.client_id}
              label={`${client.first_name} ${client.last_name || ''}`}
              value={client.client_id.toString()}
            />
          ))}
        </Picker>
      </View>
      {form.client_id && (
        <>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Number of Beds</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.number_of_beds}
              onChangeText={(text) => {
                console.log('Number of beds input:', text);
                setForm({ ...form, number_of_beds: text });
              }}
              onBlur={calculateTotals}
              placeholder="Number of Beds"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Number of Guests</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.number_of_guests}
              onChangeText={(text) => {
                console.log('Number of guests input:', text);
                setForm({ ...form, number_of_guests: text });
              }}
              onBlur={calculateTotals}
              placeholder="Number of Guests"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Unit Bed Cost (ZAR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.unit_bed_cost}
              onChangeText={(text) => {
                console.log('Unit bed cost input:', text);
                setForm({ ...form, unit_bed_cost: text });
              }}
              onBlur={calculateTotals}
              placeholder="Unit Bed Cost (ZAR)"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Check-in Date</ThemedText>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCheckInPicker(true)}
            >
              <ThemedText style={{ color: textColor }}>
                {form.check_in_date || 'Select'}
              </ThemedText>
            </TouchableOpacity>
            {showCheckInPicker && (
              <DateTimePicker
                value={form.check_in_date ? new Date(form.check_in_date) : new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange('check_in', date)}
              />
            )}
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Check-out Date</ThemedText>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <ThemedText style={{ color: textColor }}>
                {form.check_out_date || 'Select'}
              </ThemedText>
            </TouchableOpacity>
            {showCheckOutPicker && (
              <DateTimePicker
                value={form.check_out_date ? new Date(form.check_out_date) : new Date()}
                mode="date"
                display="default"
                minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
                onChange={(event, date) => handleDateChange('check_out', date)}
              />
            )}
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Breakfast Dates</ThemedText>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => form.check_in_date && form.check_out_date && setShowMealDatePicker('breakfast')}
              disabled={!form.check_in_date || !form.check_out_date}
            >
              <ThemedText style={{ color: textColor }}>
                {form.breakfast_dates.length > 0
                  ? `${form.breakfast_dates.length} dates selected`
                  : 'Select Dates'}
              </ThemedText>
            </TouchableOpacity>
            <FlatList
              data={form.breakfast_dates}
              renderItem={renderMealDate('breakfast')}
              keyExtractor={(item) => item}
              ListEmptyComponent={<ThemedText>No dates selected</ThemedText>}
              nestedScrollEnabled={true}
            />
            {showMealDatePicker === 'breakfast' && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
                maximumDate={form.check_out_date ? new Date(form.check_out_date) : undefined}
                onChange={(event, date) => handleMealDateChange('breakfast', date)}
              />
            )}
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Lunch Dates</ThemedText>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => form.check_in_date && form.check_out_date && setShowMealDatePicker('lunch')}
              disabled={!form.check_in_date || !form.check_out_date}
            >
              <ThemedText style={{ color: textColor }}>
                {form.lunch_dates.length > 0
                  ? `${form.lunch_dates.length} dates selected`
                  : 'Select Dates'}
              </ThemedText>
            </TouchableOpacity>
            <FlatList
              data={form.lunch_dates}
              renderItem={renderMealDate('lunch')}
              keyExtractor={(item) => item}
              ListEmptyComponent={<ThemedText>No dates selected</ThemedText>}
              nestedScrollEnabled={true}
            />
            {showMealDatePicker === 'lunch' && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
                maximumDate={form.check_out_date ? new Date(form.check_out_date) : undefined}
                onChange={(event, date) => handleMealDateChange('lunch', date)}
              />
            )}
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Dinner Dates</ThemedText>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => form.check_in_date && form.check_out_date && setShowMealDatePicker('dinner')}
              disabled={!form.check_in_date || !form.check_out_date}
            >
              <ThemedText style={{ color: textColor }}>
                {form.dinner_dates.length > 0
                  ? `${form.dinner_dates.length} dates selected`
                  : 'Select Dates'}
              </ThemedText>
            </TouchableOpacity>
            <FlatList
              data={form.dinner_dates}
              renderItem={renderMealDate('dinner')}
              keyExtractor={(item) => item}
              ListEmptyComponent={<ThemedText>No dates selected</ThemedText>}
              nestedScrollEnabled={true}
            />
            {showMealDatePicker === 'dinner' && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
                maximumDate={form.check_out_date ? new Date(form.check_out_date) : undefined}
                onChange={(event, date) => handleMealDateChange('dinner', date)}
              />
            )}
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Unit Breakfast Cost (ZAR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.unit_breakfast_cost}
              onChangeText={(text) => setForm({ ...form, unit_breakfast_cost: text })}
              onBlur={calculateTotals}
              placeholder="Unit Breakfast Cost (ZAR)"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Unit Lunch Cost (ZAR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.unit_lunch_cost}
              onChangeText={(text) => setForm({ ...form, unit_lunch_cost: text })}
              onBlur={calculateTotals}
              placeholder="Unit Lunch Cost (ZAR)"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Unit Dinner Cost (ZAR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.unit_dinner_cost}
              onChangeText={(text) => setForm({ ...form, unit_dinner_cost: text })}
              onBlur={calculateTotals}
              placeholder="Unit Dinner Cost (ZAR)"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Unit Laundry Cost (ZAR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.unit_laundry_cost}
              onChangeText={(text) => setForm({ ...form, unit_laundry_cost: text })}
              onBlur={calculateTotals}
              placeholder="Unit Laundry Cost (ZAR)"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Guest Details</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.guest_details}
              onChangeText={(text) => setForm({ ...form, guest_details: text })}
              placeholder="Guest Details"
              placeholderTextColor={Colors.dark.icon}
              multiline
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Discount Percentage</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.discount_percentage}
              onChangeText={(text) => setForm({ ...form, discount_percentage: text, discount_amount: '' })}
              onBlur={calculateTotals}
              placeholder="Discount Percentage"
              placeholderTextColor={Colors.dark.icon}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Discount Amount (ZAR)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
              value={form.discount_amount}
              onChangeText={(text) => setForm({ ...form, discount_amount: text, discount_percentage: '' })}
              onBlur={calculateTotals}
              placeholder="Discount Amount (ZAR)"
              placeholderTextColor={Colors.dark.icon}
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
        </>
      )}
    </ThemedView>
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
  picker: {
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
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
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