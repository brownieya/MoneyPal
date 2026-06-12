import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { CATEGORY_MAP } from '../constants/categories';

type CategoryIconProps = {
  categoryId: keyof typeof CATEGORY_MAP;
  size?: number;
};

export default function CategoryIcon({ categoryId, size = 18 }: CategoryIconProps) {
  const category = CATEGORY_MAP[categoryId];

  return (
    <View style={[styles.wrap, { backgroundColor: category.iconBackground }]}>
      <Ionicons name={category.icon as any} size={size} color={category.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
