import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';

type Props = {
  imageUrl: string | null;
  size: number;
  aspectRatio?: number;
};

export function SpotifyCover({ imageUrl, size, aspectRatio = 1 }: Props) {
  const colors = useTheme();
  const height = size / aspectRatio;

  return (
    <View style={[styles.container, { width: size, height, borderColor: colors.hair }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.bgImage} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="musical-notes" size={size * 0.2} color="rgba(255,255,255,0.15)" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
