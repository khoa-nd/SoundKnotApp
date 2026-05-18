// ── Sound Knot V2 — Card component
import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'accent' | 'hair';
}

export function Card({
  title,
  subtitle,
  children,
  variant = 'default',
  style,
  ...props
}: CardProps) {
  const colors = useTheme();

  const bg =
    variant === 'accent' ? colors.ink : variant === 'hair' ? 'transparent' : colors.paper2;
  const borderColor =
    variant === 'accent' ? colors.ink : colors.hair;
  const textColor =
    variant === 'accent' ? colors.paper : colors.ink;
  const subtitleColor =
    variant === 'accent' ? colors.inkInverse : colors.ink3;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderWidth: 1,
          borderColor,
          borderRadius: Radius.xxl,
          padding: Spacing.xxxl,
        },
        style as ViewProps['style'],
      ]}
      {...props}
    >
      {title && <Text style={[Typography.headingSmall, { color: textColor, marginBottom: Spacing.xs }]}>{title}</Text>}
      {subtitle && <Text style={[Typography.bodySmall, { color: subtitleColor, marginBottom: Spacing.xl }]}>{subtitle}</Text>}
      {children}
    </View>
  );
}
