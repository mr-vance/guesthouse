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

interface Quote {
  quote_id: number;
  quote_number: string;
  first_name: string;
  last_name: string | null;
  number_of_guests: number;
  total: number | undefined; // Allow undefined to handle API inconsistencies
}

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.QUOTES);
      console.log('Quotes API response:', response.data); // Log for debugging
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(search.toLowerCase()) ||
    `${quote.first_name} ${quote.last_name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const renderQuote = ({ item }: { item: Quote }) => (
    <Link href={`/quote-details/${item.quote_id}`} asChild>
      <TouchableOpacity style={styles.quoteItem}>
        <ThemedText type="defaultSemiBold">{`Quote ${item.quote_number}`}</ThemedText>
        <ThemedText>{`${item.first_name} ${item.last_name || ''}`}</ThemedText>
        <ThemedText>{`Guests: ${item.number_of_guests}`}</ThemedText>
        <ThemedText style={styles.total}>
          {typeof item.total === 'number' ? `R${item.total.toFixed(2)}` : 'N/A'}
        </ThemedText>
        <IconSymbol name="chevron.right" size={18} color={Colors.light.icon} />
      </TouchableOpacity>
    </Link>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <TextInput
        style={[styles.searchInput, { borderColor: Colors.light.icon }]}
        placeholder="Search quotes..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={item => item.quote_id.toString()}
        ListEmptyComponent={<ThemedText>No quotes found.</ThemedText>}
      />
      <Link href="/create-quote" asChild>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors.light.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.addButtonText}>+</ThemedText>
        </TouchableOpacity>
      </Link>
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
  quoteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  total: {
    fontSize: 14,
    color: Colors.light.tint,
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
  },
});