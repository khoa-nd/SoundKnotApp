import React from 'react';
import { FlatList, StyleSheet, type ListRenderItem } from 'react-native';
import type { ContentItem } from '../../types';
import { ContentCard } from './ContentCard';
import { EmptyState } from '../ui/EmptyState';

interface ContentListProps {
  items: ContentItem[];
  progressMap?: Record<string, number>;
  onItemPress: (item: ContentItem) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
}

export function ContentList({
  items,
  progressMap = {},
  onItemPress,
  onRefresh,
  refreshing,
  ListHeaderComponent,
}: ContentListProps) {
  const renderItem: ListRenderItem<ContentItem> = ({ item }) => (
    <ContentCard
      item={item}
      progress={progressMap[item.id]}
      onPress={() => onItemPress(item)}
    />
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="No content found"
        description="Try adjusting your filters or come back later for fresh content."
      />
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      ItemSeparatorComponent={() => <></>}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 100,
  },
});
