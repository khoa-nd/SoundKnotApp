// ── Sound Knot V2 — Tag / Chip component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';

interface TagProps {
  label: string;
  variant?: 'filled' | 'outlined' | 'chip';
  color?: string;
  dotColor?: string;
  icon?: React.ReactNode;
}

export function Tag({ label, variant = 'chip', color, dotColor, icon }: TagProps) {
  const colors = useTheme();

  if (variant === 'chip') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          borderRadius: Radius.md,
          backgroundColor: colors.paper2,
          borderWidth: 1,
          borderColor: colors.hair2,
          alignSelf: 'flex-start',
        }}
      >
        {dotColor && (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
        )}
        {icon}
        <Text style={[Typography.chip, { color: color || colors.ink2, textTransform: 'uppercase' }]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.md,
        alignSelf: 'flex-start',
        backgroundColor: variant === 'filled' ? (color || colors.accent) + '20' : 'transparent',
        borderWidth: variant === 'outlined' ? 1 : 0,
        borderColor: color || colors.accent,
      }}
    >
      <Text
        style={[
          Typography.chip,
          {
            color: color || colors.ink2,
            textTransform: 'uppercase',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function LevelTag({ level }: { level: string }) {
  const colors = useTheme();
  const colorMap: Record<string, string> = {
    beginner: colors.positive,
    intermediate: colors.accent,
    advanced: colors.accentInk,
    master: colors.ink,
  };
  return <Tag label={level} variant="outlined" color={colorMap[level] ?? colors.ink} />;
}
