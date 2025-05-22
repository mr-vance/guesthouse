import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import axios from 'axios';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { API_ENDPOINTS } from '@/constants/Api';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface Quote {
  quote_id: number;
  quote_number: string;
  first_name: string;
  last_name: string;
  number_of_guests: number;
  total: string;
  invoice_status: 'invoiced' | 'unpaid';
  last_modified: string;
}

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.QUOTES);
      console.log('Quotes API response:', response.data);
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setQuotes([]);
    }
  };

  const renderQuote = ({ item }: { item: Quote }) => {
    const total = parseFloat(item.total) || 0;
    return (
      <Link href={`/quote-details/${item.quote_id}`} asChild>
        <TouchableOpacity style={styles.quoteItem}>
          <ThemedText type="defaultSemiBold">
            Quote #{item.quote_number} - {item.first_name} {item.last_name}
          </ThemedText>
          <ThemedText>Guests: {item.number_of_guests}</ThemedText>
          <ThemedText>Total: R{total.toFixed(2)}</ThemedText>
          <ThemedText>Status: {item.invoice_status}</ThemedText>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText type="title">Quotes</ThemedText>
      <Link href="/create-quote" asChild>
        <TouchableOpacity style={styles.addButton}>
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>Add Quote</ThemedText>
        </TouchableOpacity>
      </Link>
      <FlatList
        data={quotes}
        renderItem={renderQuote}
        keyExtractor={item => item.quote_id.toString()}
        ListEmptyComponent={<ThemedText>No quotes found.</ThemedText>}
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
  quoteItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
  },
  addButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
  },
});