import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
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
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({}, 'card');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredInvoices(
      invoices.filter((invoice) =>
        invoice.quote_number.toLowerCase().includes(lowerSearch)
      )
    );
  }, [search, invoices]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.QUOTES}?status=invoiced`);
      let data = response.data.filter((item: Invoice) => item.invoice_status === 'invoiced');
      console.log('Invoices API response:', data);
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      setFilteredInvoices([]);
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const total = parseFloat(item.total) || 0;
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
      <TextInput
        style={[styles.searchBar, { backgroundColor: inputBackground, color: textColor, borderColor: textColor }]}
        value={search}
        onChangeText={setSearch}
        placeholder="Search invoices..."
        placeholderTextColor={Colors.dark.icon}
      />
      <FlatList
        data={filteredInvoices}
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
    paddingTop: 60, // Increased to avoid status bar overlap
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  invoiceItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
  },
});