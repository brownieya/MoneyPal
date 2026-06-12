import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CategoryIcon from '../components/CategoryIcon';
import { CATEGORIES } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';
import { CategoryId } from '../types';
import { colors, radius, shadows, spacing, typography } from '../theme/tokens';

export default function AddScreen() {
  const { addTransaction } = useTransactionStore();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryId>('other');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const yuan = parseFloat(amount);

    if (Number.isNaN(yuan) || yuan <= 0) {
      Alert.alert('提示', '请输入正确的金额。');
      return;
    }

    addTransaction({
      amount: Math.round(yuan * 100),
      category,
      note,
      source: 'manual',
      raw: '',
      externalId: '',
      createdAt: new Date().toISOString(),
    });

    setAmount('');
    setNote('');
    setCategory('other');
    Alert.alert('已添加', `¥${yuan.toFixed(2)} 已记录到账单。`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>MoneyPal</Text>
              <Text style={styles.headerTitle}>快速记一笔</Text>
            </View>
            <View style={styles.headerBadge}>
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={styles.headerBadgeText}>轻量录入</Text>
            </View>
          </View>

          <View style={styles.amountCard}>
            <Text style={styles.fieldLabel}>金额</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountPrefix}>¥</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={styles.fieldHint}>金额放在第一视觉层，录入会更快更明确。</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>分类</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(item => {
                const active = category === item.id;

                return (
                  <Pressable
                    key={item.id}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}
                    onPress={() => setCategory(item.id)}
                  >
                    <CategoryIcon categoryId={item.id} />
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>备注</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="补充这笔消费的说明，例如午餐、打车、会员续费"
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </View>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>保存账单</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: colors.textTertiary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  headerTitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  amountCard: {
    marginTop: spacing.xl,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  amountRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amountPrefix: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
  },
  fieldHint: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  categoryGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '23%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.sm,
  },
  categoryCardActive: {
    backgroundColor: colors.primaryMuted,
  },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: colors.primary,
  },
  noteInput: {
    minHeight: 104,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.body,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.xl,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
