import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Invoice {
  quote_id: number;
  quote_number: string;
  first_name: string;
  last_name: string;
  number_of_guests: number;
  total: string;
  invoice_status: 'invoiced' | 'unpaid';
  last_modified: string;
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.QUOTES}?status=invoiced`);
      let data = response.data;
      // Fallback: filter client-side to ensure only invoiced quotes
      data = data.filter((item: Invoice) => item.invoice_status === 'invoiced');
      console.log('Invoices API response:', data);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const total = parseFloat(item.total) || 0; // Parse string to number, fallback to 0
    return (
      <TouchableOpacity style={styles.invoiceItem}>
        <ThemedText type="defaultSemiBold">
          Quote #{item.quote_number} - {item.first_name} {item.last_name}
        </ThemedText>
        <ThemedText>Guests: {item.number_of_guests}</ThemedText>
        <ThemedText>Total: R{total.toFixed(2)}</ThemedText>
        <ThemedText>Last Modified: {item.last_modified}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText type="title">Invoices</ThemedText>
      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={item => item.quote_id.toString()}
        ListEmptyComponent={<ThemedText>No invoices found.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
  },
  invoiceItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
  },
});