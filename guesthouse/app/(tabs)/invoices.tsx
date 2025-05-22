import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Invoice {
  quote_id: number;
  quote_number: string;
  first_name: string;
  last_name: string | null;
  number_of_guests: number;
  total: number;
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.QUOTES);
      const invoicedQuotes = response.data.filter((quote: any) => quote.invoice_status === 'invoiced');
      setInvoices(invoicedQuotes);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.quote_number.toLowerCase().includes(search.toLowerCase()) ||
    `${invoice.first_name} ${invoice.last_name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <Link href={`/quote-details/${item.quote_id}`} asChild>
      <TouchableOpacity style={styles.invoiceItem}>
        <ThemedText type="defaultSemiBold">{`Invoice ${item.quote_number}`}</ThemedText>
        <ThemedText>{`${item.first_name} ${item.last_name || ''}`}</ThemedText>
        <ThemedText>{`Guests: ${item.number_of_guests}`}</ThemedText>
        <ThemedText style={styles.total}>{`R${item.total.toFixed(2)}`}</ThemedText>
        <IconSymbol name="chevron.right" size={18} color={Colors.light.icon} />
      </TouchableOpacity>
    </Link>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <TextInput
        style={[styles.searchInput, { borderColor: Colors.light.icon }]}
        placeholder="Search invoices..."
        value={search}
        onChangeText={setSearch}
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
  },
  searchInput: {
    borderBottomWidth: 1,
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  invoiceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  total: {
    fontSize: 14,
    color: Colors.light.tint,
  },
});