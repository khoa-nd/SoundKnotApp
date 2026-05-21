import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { ContentItem } from '../../types';
import { Colors } from '../../constants/Colors';
import { ContentCard } from './ContentCard';
import { useUserStore } from '../../stores/userStore';

interface CuriosityFeedProps {
  items: ContentItem[];
  onItemPress: (item: ContentItem) => void;
}

export function CuriosityFeed({ items, onItemPress }: CuriosityFeedProps) {
  const interests = useUserStore((s) => s.user?.interests ?? []);

  const scored = useMemo(() => {
    return items
      .map((item) => ({
        item,
        score: item.topics.filter((t) => interests.includes(t)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [items, interests]);

  if (scored.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No recommendations yet</Text>
        <Text style={styles.emptyDesc}>
          Add interests in your profile to get personalized content.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Curated For You</Text>
        <Text style={styles.subtitle}>Based on your interests: {interests.join(', ')}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={300}
        decelerationRate="fast"
      >
        {scored.slice(0, 10).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.feedCard}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
          >
            <ContentCard item={item} onPress={() => onItemPress(item)} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  feedCard: {
    width: 300,
    marginRight: 14,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
