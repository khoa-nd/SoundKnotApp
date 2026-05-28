import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';
import { useTheme } from '../../constants/theme';
import { Skeleton } from '../ui/Skeleton';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 200;

type Props = {
  title: string;
  count?: number;
};

export function RankedSliderSkeleton({ title, count = 4 }: Props) {
  const colors = useTheme();

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
          <View key={i} style={{ width: CARD_WIDTH }}>
            <Skeleton width={CARD_WIDTH} height={CARD_HEIGHT} radius={Radius.xl} />
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
