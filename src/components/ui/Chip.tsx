// ── Sound Knot V2 — Chip (mono label badge)
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';

interface ChipProps {
  label: string;
  dotColor?: string;
  icon?: React.ReactNode;
}

export function Chip({ label, dotColor, icon }: ChipProps) {
  const colors = useTheme();

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
      <Text style={[Typography.chip, { color: colors.ink2, textTransform: 'uppercase' }]}>
        {label}
      </Text>
    </View>
  );
}
