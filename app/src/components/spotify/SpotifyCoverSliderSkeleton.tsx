import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useTheme } from '../../constants/theme';
import { Skeleton } from '../ui/Skeleton';

const COVER_SIZE = 160;

type Props = {
  title: string;
  count?: number;
  aspectRatio?: number;
};

export function SpotifyCoverSliderSkeleton({ title, count = 4, aspectRatio = 1 }: Props) {
  const colors = useTheme();
  const height = COVER_SIZE / aspectRatio;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ width: COVER_SIZE }}>
            <Skeleton width={COVER_SIZE} height={height} radius={6} />
            <View style={{ marginTop: Spacing.sm }}>
              <Skeleton width={'90%'} height={12} radius={3} />
            </View>
            <View style={{ marginTop: 6 }}>
              <Skeleton width={'60%'} height={10} radius={3} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.heading,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  scrollView: {
    flexGrow: 0,
    marginHorizontal: -Spacing.screen,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    gap: Spacing.lg,
  },
});
