// ── Sound Knot V2 — Button component
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Typography } from '../../constants/Typography';
import { Spacing, Radius } from '../../constants/Spacing';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'ghost' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useTheme();

  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  };

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: colors.ink, borderRadius: Radius.xl }
      : variant === 'ghost'
        ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hair, borderRadius: Radius.xl }
        : { backgroundColor: colors.ink, borderRadius: Radius.pill };

  const sizeStyle: ViewStyle =
    size === 'lg'
      ? { paddingHorizontal: Spacing.xxxl, paddingVertical: Spacing.xxxl }
      : size === 'sm'
        ? { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }
        : { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xl };

  const textColor =
    variant === 'primary' || variant === 'pill'
      ? colors.paper
      : colors.ink;

  return (
    <TouchableOpacity
      style={[baseStyle, variantStyle, sizeStyle, disabled && { opacity: 0.4 }, style as ViewStyle]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[Typography.button, { color: textColor }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
