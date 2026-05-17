// ── Sound Knot V2 — Empty State component
import React from 'react';
import { View, Text, type ViewProps } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';

interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, description, children, style }: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        {
          padding: Spacing.xxl,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.hair,
          borderRadius: Radius.xl,
          alignItems: 'center',
        },
        style as ViewProps['style'],
      ]}
    >
      <Text style={[Typography.bodySmall, { color: colors.ink3, textAlign: 'center' }]}>{title}</Text>
      {description && (
        <Text style={[Typography.bodySmall, { color: colors.ink4, textAlign: 'center', marginTop: Spacing.xs }]}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
}
