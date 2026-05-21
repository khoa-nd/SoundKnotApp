// ── Sound Knot V2 — Progress Bar (thin ink fill)
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  style?: ViewStyle;
  color?: string;
  backgroundColor?: string;
  showGlow?: boolean;
  /** Show mastery dots instead of continuous bar */
  mastery?: number; // 0-1 -> number of filled dots (1-5)
}

export function ProgressBar({ progress, height = 2, style, color, backgroundColor, mastery }: ProgressBarProps) {
  const colors = useTheme();
  const clamped = Math.min(Math.max(progress, 0), 1);

  const fillColor = color || colors.ink;
  const trackColor = backgroundColor || colors.hair;

  if (mastery !== undefined) {
    const filled = Math.round(mastery * 5);
    return (
      <View style={[{ flexDirection: 'row', gap: 3 }, style]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              height: 3,
              flex: 1,
              borderRadius: 2,
              backgroundColor: i < filled ? colors.ink : colors.hair,
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
