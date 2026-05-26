// ── Sound Knot V2 — Progress Screen
// Streak stats + 12-week heatmap + listening indicators + per-segment mastery
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/constants/theme';
import { Typography } from '../../src/constants/Typography';
import { Spacing, Radius } from '../../src/constants/Spacing';
import { Knot } from '../../src/components/ui/Knot';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { authService } from '../../src/services/auth';
import { homeService } from '../../src/services/home';
import { useAuthStore } from '../../src/stores/authStore';
import type { UserProgress, PracticeSession } from '../../src/types';

export default function ProgressScreen() {
  const colors = useTheme();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [recentKnots, setRecentKnots] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign out?',
      'You will need to sign in again to access your videos and progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await logout();
              router.replace('/login');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ],
    );
  }, [logout]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      Promise.all([authService.me(), homeService.fetch()])
        .then(([meData, homeData]) => {
          if (cancelled) return;
          setProgress(meData.progress);
          setRecentKnots(homeData.recentKnots ?? []);
        })
        .catch(() => {
          // silently fail
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => { cancelled = true; };
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[Typography.marker, { color: colors.ink4 }]}>Your practice</Text>
          <Text style={[Typography.headingLarge, { marginTop: Spacing.xs }]}>Progress</Text>
        </View>

        {/* Stat grid */}
        <View style={styles.statGrid}>
          <StatCard
            label="Current streak"
            value={String(progress?.current_streak ?? 0)}
            unit="days"
            accent
            colors={colors}
          />
          <StatCard
            label="Longest"
            value={String(progress?.longest_streak ?? 0)}
            unit="days"
            colors={colors}
          />
          <StatCard
            label="Sessions"
            value={String(progress?.total_sessions ?? 0)}
            unit="total"
            colors={colors}
          />
          <StatCard
            label="Minutes"
            value={String(progress?.total_minutes ?? 0)}
            unit="total"
            colors={colors}
          />
        </View>

        {/* Per-segment mastery */}
        {recentKnots.length > 0 && (
          <View style={styles.masterySection}>
            <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.lg }]}>
              Active knots · mastery
            </Text>
            {recentKnots.map((item) => (
              <View
                key={item.id}
                style={[styles.masteryItem, { borderTopColor: colors.hair }]}
              >
                <Knot size={32} progress={item.mastery} mastery={item.mastery} pass={item.pass} subdued={0.3} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySmall, { fontWeight: '500' }]} numberOfLines={1}>
                    {item.user_videos?.title ?? 'Untitled'}
                  </Text>
                  <ProgressBar progress={item.mastery} style={{ marginTop: Spacing.sm }} />
                </View>
                <Text style={[Typography.markerLarge, { color: colors.ink3, minWidth: 36, textAlign: 'right' }]}>
                  {Math.round(item.mastery * 100)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.accountSection}>
          <Text style={[Typography.marker, { color: colors.ink4, marginBottom: Spacing.lg }]}>
            Account
          </Text>
          {user?.email && (
            <Text
              style={[Typography.bodySmall, { color: colors.ink3, marginBottom: Spacing.lg }]}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: colors.hair }]}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color={colors.ink} />
                <Text style={[Typography.button, { color: colors.ink }]}>Sign out</Text>
              </>
            )}
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.devLink, { borderColor: colors.hair, backgroundColor: colors.paper2 }]}
              onPress={() => router.push('/playground' as any)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open model playground"
            >
              <Ionicons name="flask-outline" size={18} color={colors.ink} />
              <Text style={[Typography.button, { color: colors.ink }]}>Model Playground</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
  colors,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  colors: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: accent ? colors.ink : colors.paper2,
          borderColor: accent ? colors.ink : colors.hair,
        },
      ]}
    >
      <Text
        style={[
          Typography.marker,
          {
            color: accent ? colors.inkInverse : colors.ink4,
            marginBottom: Spacing.sm,
          },
        ]}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs }}>
        <Text style={[Typography.monoStat, { color: accent ? colors.paper : colors.ink }]}>{value}</Text>
        <Text style={[Typography.marker, { color: accent ? colors.inkInverse : colors.ink3 }]}>
          {unit}
        </Text>
      </View>
      {accent && (
        <View style={{ marginTop: Spacing.lg, flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: Math.min(parseInt(value) || 0, 30) }, (_, i) => (
            <View
              key={i}
              style={{ flex: 1, height: 6, borderRadius: 1, backgroundColor: colors.accent, opacity: 0.9 }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.screen },
  header: { marginBottom: Spacing.xxl },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '47%',
    padding: Spacing.xxl,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  masterySection: { marginTop: Spacing.massive },
  masteryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
  },
  accountSection: { marginTop: Spacing.massive },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  devLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
  },
});
