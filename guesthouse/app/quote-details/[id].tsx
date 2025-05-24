import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, View, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Quote {
  quote_number: string;
  client_id: number; // For backend only, not displayed
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
  invoice_status: 'UNPAID' | 'INVOICED';
}

interface Client {
  first_name: string;
  last_name: string | null;
}

export default function QuoteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [clientName, setClientName] = useState<string>('Loading...');
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
  const [showMealDatePicker, setShowMealDatePicker] = useState<'breakfast' | 'lunch' | 'dinner' | 'laundry' | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    booking: true,
    costs: true,
    financial: true,
  });
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({}, 'card');

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
        quote_number: response.data.quote_number,
        client_id: parseInt(response.data.client_id, 10),
        number_of_beds: parseInt(response.data.number_of_beds || '0', 10) || 0,
        number_of_guests: parseInt(response.data.number_of_guests || '0', 10) || 0,
        unit_bed_cost: parseFloat(response.data.unit_bed_cost || '0') || 0,
        unit_breakfast_cost: parseFloat(response.data.unit_breakfast_cost || '0') || 0,
        unit_lunch_cost: parseFloat(response.data.unit_lunch_cost || '0') || 0,
        unit_dinner_cost: parseFloat(response.data.unit_dinner_cost || '0') || 0,
        unit_laundry_cost: parseFloat(response.data.unit_laundry_cost || '0') || 0,
        guest_details: response.data.guest_details || null,
        check_in_date: response.data.check_in_date || '',
        check_out_date: response.data.check_out_date || '',
        breakfast_dates: JSON.parse(response.data.breakfast_dates || '[]'),
        lunch_dates: JSON.parse(response.data.lunch_dates || '[]'),
        dinner_dates: JSON.parse(response.data.dinner_dates || '[]'),
        laundry_dates: JSON.parse(response.data.laundry_dates || '[]'),
        discount_percentage: parseFloat(response.data.discount_percentage || '0') || 0,
        discount_amount: parseFloat(response.data.discount_amount || '0') || 0,
        subtotal: parseFloat(response.data.subtotal || '0') || 0,
        vat: parseFloat(response.data.vat || '0') || 0,
        total: parseFloat(response.data.total) || 0,
        document_type: response.data.document_type || 'detailed',
        invoice_status: (response.data.invoice_status || 'unpaid').toUpperCase() as 'UNPAID' | 'INVOICED',
      };
      console.log('Fetched quote:', data);
      setQuote(data);
      setForm(data);

      // Fetch client name
      try {
        const clientResponse = await axios.get(`${API_ENDPOINTS.CLIENTS}?id=${data.client_id}`);
        const client: Client = clientResponse.data;
        setClientName(`${client.first_name} ${client.last_name || ''}`.trim());
      } catch (error) {
        console.error('Error fetching client:', error);
        setClientName('Unknown Client');
      }

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

    return { ...currentForm, subtotal, vat, total };
  };

  const handleUpdate = async () => {
    if (
      !form.number_of_beds ||
      !form.number_of_guests ||
      !form.unit_bed_cost ||
      !form.check_in_date ||
      !form.check_out_date
    ) {
      Alert.alert('Error', 'Required fields are missing.');
      return;
    }
    const checkInDate = new Date(form.check_in_date);
    const checkOutDate = new Date(form.check_out_date);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      Alert.alert('Error', 'Invalid check-in or check-out date.');
      return;
    }
    const validateDates = (dates: string[]) =>
      dates.every((date) => {
        const d = new Date(date);
        return d >= checkInDate && d <= checkOutDate;
      });

    if (
      !validateDates(form.breakfast_dates || []) ||
      !validateDates(form.lunch_dates || []) ||
      !validateDates(form.dinner_dates || []) ||
      !validateDates(form.laundry_dates || [])
    ) {
      Alert.alert('Error', 'Meal and laundry dates must be between check-in and check-out dates.');
      return;
    }

    try {
      const payload = {
        client_id: quote!.client_id,
        quote_number: form.quote_number || quote!.quote_number,
        number_of_beds: form.number_of_beds,
        number_of_guests: form.number_of_guests,
        unit_bed_cost: form.unit_bed_cost,
        unit_breakfast_cost: form.unit_breakfast_cost || 0,
        unit_lunch_cost: form.unit_lunch_cost || 0,
        unit_dinner_cost: form.unit_dinner_cost || 0,
        unit_laundry_cost: form.unit_laundry_cost || 0,
        guest_details: form.guest_details || '',
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        breakfast_dates: JSON.stringify(form.breakfast_dates || []),
        lunch_dates: JSON.stringify(form.lunch_dates || []),
        dinner_dates: JSON.stringify(form.dinner_dates || []),
        laundry_dates: JSON.stringify(form.laundry_dates || []),
        discount_percentage: form.discount_percentage || 0,
        discount_amount: form.discount_amount || 0,
        document_type: form.document_type || 'detailed',
      };
      console.log('Update payload:', payload);
      const response = await axios.put(`${API_ENDPOINTS.QUOTES}?id=${id}`, payload);
      console.log('Update response:', response.data);
      await fetchQuote(); // Re-fetch to ensure UI sync
      setIsEditing(false);
      Alert.alert('Success', 'Quote updated successfully.');
    } catch (error: any) {
      console.error('Error updating quote:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update quote.');
    }
  };

  const handleInvoice = async () => {
    try {
      await axios.put(`${API_ENDPOINTS.QUOTES}?id=${id}`, { invoice_status: 'INVOICED' });
      setQuote({ ...quote!, invoice_status: 'INVOICED' });
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

  const handleDateChange = (type: 'check_in' | 'check_out', date: Date | undefined) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    const newForm = {
      ...form,
      [`${type}_date`]: dateString,
      ...(type === 'check_in' || type === 'check_out'
        ? { breakfast_dates: [], lunch_dates: [], dinner_dates: [], laundry_dates: [] }
        : {}),
    };
    const updatedForm = calculateTotals(newForm);
    setForm(updatedForm);
    setShowCheckInPicker(false);
    setShowCheckOutPicker(false);
  };

  const handleMealDateChange = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'laundry', date: Date | undefined) => {
    if (!date) return;
    const dateString = date.toISOString().split('T')[0];
    const currentDates = form[`${mealType}_dates`] || [];
    const newDates = currentDates.includes(dateString)
      ? currentDates.filter((d) => d !== dateString)
      : [...currentDates, dateString].sort();
    const newForm = { ...form, [`${mealType}_dates`]: newDates };
    const updatedForm = calculateTotals(newForm);
    setForm(updatedForm);
    setShowMealDatePicker(null);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderField = (
    label: string,
    value: string | number | string[] | null,
    key: keyof Quote,
    placeholder: string,
    options?: { editable?: boolean; type?: 'numeric' | 'text' | 'multiline' | 'date' | 'array' | 'currency' }
  ) => {
    const isArray = options?.type === 'array';
    const isCurrency = options?.type === 'currency';
    const displayValue = isCurrency && typeof value === 'number' && value !== 0
      ? `R${value.toFixed(2)}`
      : typeof value === 'string' || typeof value === 'number'
      ? value.toString()
      : 'Not provided';

    return (
      <View style={styles.field}>
        <ThemedText style={[styles.fieldLabel, { color: textColor }]}>{label}</ThemedText>
        {isEditing && options?.editable && options?.type === 'date' ? (
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => (key === 'check_in_date' ? setShowCheckInPicker(true) : setShowCheckOutPicker(true))}
          >
            <ThemedText style={{ color: textColor }}>{form[key]?.toString() || 'Select'}</ThemedText>
          </TouchableOpacity>
        ) : isEditing && options?.editable && options?.type === 'array' ? (
          <>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => form.check_in_date && form.check_out_date && setShowMealDatePicker(key as any)}
              disabled={!form.check_in_date || !form.check_out_date}
            >
              <ThemedText style={{ color: textColor }}>
                {Array.isArray(form[key]) && (form[key] as string[]).length > 0
                  ? `${(form[key] as string[]).length} dates selected`
                  : 'Select dates'}
              </ThemedText>
            </TouchableOpacity>
            {Array.isArray(form[key]) && (form[key] as string[]).length > 0 && (
              <View style={styles.dateList}>
                {(form[key] as string[]).map((date) => (
                  <View key={date} style={styles.dateItem}>
                    <ThemedText style={{ color: textColor }}>{date}</ThemedText>
                    <TouchableOpacity
                      onPress={() => {
                        const newDates = (form[key] as string[])?.filter((d) => d !== date);
                        const newForm = { ...form, [key]: newDates };
                        const updatedForm = calculateTotals(newForm);
                        setForm(updatedForm);
                      }}
                    >
                      <ThemedText style={{ color: '#ff4444' }}>Remove</ThemedText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : isEditing && options?.editable ? (
          <TextInput
            style={[
              styles.input,
              { backgroundColor: cardBackground, color: textColor, borderColor: textColor },
              options?.type === 'multiline' && { height: 80, textAlignVertical: 'top' },
            ]}
            value={form[key]?.toString() || ''}
            onChangeText={(text) => {
              const newForm = {
                ...form,
                [key]:
                  options?.type === 'numeric' ? (text ? parseFloat(text) || 0 : 0) : text,
              };
              const updatedForm = calculateTotals(newForm);
              setForm(updatedForm);
            }}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.icon}
            keyboardType={options?.type === 'numeric' ? 'numeric' : 'default'}
            multiline={options?.type === 'multiline'}
          />
        ) : isArray && Array.isArray(value) && value.length > 0 ? (
          <View>
            {value.map((date) => (
              <ThemedText key={date} style={[styles.arrayItem, { color: textColor }]}>{date}</ThemedText>
            ))}
          </View>
        ) : (
          <ThemedText style={[styles.fieldValue, { color: textColor }]}>{displayValue}</ThemedText>
        )}
      </View>
    );
  };

  if (!quote) return <ThemedText style={{ color: textColor }}>Loading...</ThemedText>;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView>
        {/* Booking Details Section */}
        <View style={[styles.section, { backgroundColor: cardBackground }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('booking')}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Booking Details</ThemedText>
            <Ionicons
              name={expandedSections.booking ? 'chevron-down' : 'chevron-forward'}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
          {expandedSections.booking && (
            <View style={styles.sectionContent}>
              {renderField('Quote Number', quote.quote_number, 'quote_number', 'Quote Number', {
                editable: false,
              })}
              {renderField('Client Name', clientName, 'client_name' as any, 'Client Name', {
                editable: false,
              })}
              {renderField('Number of Beds', quote.number_of_beds, 'number_of_beds', 'Number of Beds', {
                editable: isEditing,
                type: 'numeric',
              })}
              {renderField('Number of Guests', quote.number_of_guests, 'number_of_guests', 'Number of Guests', {
                editable: isEditing,
                type: 'numeric',
              })}
              {renderField('Check-in Date', quote.check_in_date, 'check_in_date', 'Check-in Date', {
                editable: isEditing,
                type: 'date',
              })}
              {renderField('Check-out Date', quote.check_out_date, 'check_out_date', 'Check-out Date', {
                editable: isEditing,
                type: 'date',
              })}
              {renderField('Guest Details', quote.guest_details, 'guest_details', 'Guest Details', {
                editable: isEditing,
                type: 'multiline',
              })}
            </View>
          )}
        </View>

        {/* Meal & Service Costs Section */}
        <View style={[styles.section, { backgroundColor: cardBackground }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('costs')}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Meal & Service Costs</ThemedText>
            <Ionicons
              name={expandedSections.costs ? 'chevron-down' : 'chevron-forward'}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
          {expandedSections.costs && (
            <View style={styles.sectionContent}>
              {renderField('Unit Bed Cost', quote.unit_bed_cost, 'unit_bed_cost', 'Unit Bed Cost', {
                editable: isEditing,
                type: 'currency',
              })}
              {renderField('Unit Breakfast Cost', quote.unit_breakfast_cost, 'unit_breakfast_cost', 'Unit Breakfast Cost', {
                editable: isEditing,
                type: 'currency',
              })}
              {renderField('Unit Lunch Cost', quote.unit_lunch_cost, 'unit_lunch_cost', 'Unit Lunch Cost', {
                editable: isEditing,
                type: 'currency',
              })}
              {renderField('Unit Dinner Cost', quote.unit_dinner_cost, 'unit_dinner_cost', 'Unit Dinner Cost', {
                editable: isEditing,
                type: 'currency',
              })}
              {renderField('Unit Laundry Cost', quote.unit_laundry_cost, 'unit_laundry_cost', 'Unit Laundry Cost', {
                editable: isEditing,
                type: 'currency',
              })}
              {renderField('Breakfast Dates', quote.breakfast_dates, 'breakfast_dates', 'Breakfast Dates', {
                editable: isEditing,
                type: 'array',
              })}
              {renderField('Lunch Dates', quote.lunch_dates, 'lunch_dates', 'Lunch Dates', {
                editable: isEditing,
                type: 'array',
              })}
              {renderField('Dinner Dates', quote.dinner_dates, 'dinner_dates', 'Dinner Dates', {
                editable: isEditing,
                type: 'array',
              })}
              {renderField('Laundry Dates', quote.laundry_dates, 'laundry_dates', 'Laundry Dates', {
                editable: isEditing,
                type: 'array',
              })}
            </View>
          )}
        </View>

        {/* Financial Summary Section */}
        <View style={[styles.section, { backgroundColor: cardBackground }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('financial')}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Financial Summary</ThemedText>
            <Ionicons
              name={expandedSections.financial ? 'chevron-down' : 'chevron-forward'}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
          {expandedSections.financial && (
            <View style={styles.sectionContent}>
              {renderField('Discount Percentage', quote.discount_percentage, 'discount_percentage', 'Discount Percentage', {
                editable: isEditing,
                type: 'numeric',
              })}
              {renderField('Discount Amount', quote.discount_amount, 'discount_amount', 'Discount Amount', {
                editable: isEditing,
                type: 'currency',
              })}
              {renderField('Subtotal', `R${quote.subtotal.toFixed(2)}`, 'subtotal', 'Subtotal', {
                editable: false,
              })}
              {renderField('VAT (15%)', `R${quote.vat.toFixed(2)}`, 'vat', 'VAT (15%)', {
                editable: false,
              })}
              {renderField('Total', `R${quote.total.toFixed(2)}`, 'total', 'Total', {
                editable: false,
              })}
              {renderField('Document Type', quote.document_type, 'document_type', 'Document Type', {
                editable: false,
              })}
              {renderField('Invoice Status', quote.invoice_status, 'invoice_status', 'Invoice Status', {
                editable: false,
              })}
            </View>
          )}
        </View>

        {/* Date Pickers */}
        {showCheckInPicker && (
          <Modal visible={showCheckInPicker} transparent={Platform.OS === 'android'} animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.pickerContainer, { backgroundColor: cardBackground }]}>
                <DateTimePicker
                  value={form.check_in_date ? new Date(form.check_in_date) : new Date('2025-05-24')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                  onChange={(event, date) => {
                    setShowCheckInPicker(false);
                    handleDateChange('check_in', date);
                  }}
                />
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowCheckInPicker(false)}
                  >
                    <ThemedText style={{ color: Colors.light.tint }}>Close</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}
        {showCheckOutPicker && (
          <Modal visible={showCheckOutPicker} transparent={Platform.OS === 'android'} animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.pickerContainer, { backgroundColor: cardBackground }]}>
                <DateTimePicker
                  value={form.check_out_date ? new Date(form.check_out_date) : new Date('2025-05-24')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                  minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
                  onChange={(event, date) => {
                    setShowCheckOutPicker(false);
                    handleDateChange('check_out', date);
                  }}
                />
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowCheckOutPicker(false)}
                  >
                    <ThemedText style={{ color: Colors.light.tint }}>Close</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}
        {showMealDatePicker && (
          <Modal visible={!!showMealDatePicker} transparent={Platform.OS === 'android'} animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.pickerContainer, { backgroundColor: cardBackground }]}>
                <DateTimePicker
                  value={new Date('2025-05-24')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                  minimumDate={form.check_in_date ? new Date(form.check_in_date) : undefined}
                  maximumDate={form.check_out_date ? new Date(form.check_out_date) : undefined}
                  onChange={(event, date) => {
                    handleMealDateChange(showMealDatePicker, date);
                    setShowMealDatePicker(null);
                  }}
                />
                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowMealDatePicker(null)}
                  >
                    <ThemedText style={{ color: Colors.light.tint }}>Close</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}

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
                  setForm(quote!); // Reset form to original quote data
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
              {quote.invoice_status === 'UNPAID' && (
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
    </ThemedView>
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
  arrayItem: {
    fontSize: 16,
    opacity: 0.8,
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
  dateList: {
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.5)' : 'transparent',
  },
  pickerContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    marginTop: 8,
    alignItems: 'center',
    padding: 10,
  },
});