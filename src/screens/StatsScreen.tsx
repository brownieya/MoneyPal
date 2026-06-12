import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CategoryIcon from '../components/CategoryIcon';
import { CATEGORY_MAP } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';
import { SummaryPeriod } from '../types';
import { colors, radius, shadows, spacing, typography } from '../theme/tokens';
import { formatCurrency } from '../utils/formatters';

const PERIODS: SummaryPeriod[] = ['week', 'month', 'year'];

const PERIOD_LABELS: Record<SummaryPeriod, string> = {
  week: '本周',
  month: '本月',
  year: '本年',
};

export default function StatsScreen() {
  const { summary, summaryPeriod, loadSummary } = useTransactionStore();

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const total = summary.reduce((sum, item) => sum + item.total, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>MoneyPal</Text>
            <Text style={styles.headerTitle}>消费统计</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="pulse-outline" size={16} color={colors.success} />
            <Text style={styles.headerBadgeText}>趋势可见</Text>
          </View>
        </View>

        <View style={styles.segmented}>
          {PERIODS.map(period => {
            const active = summaryPeriod === period;

            return (
              <Pressable
                key={period}
                style={[styles.segmentButton, active && styles.segmentButtonActive]}
                onPress={() => loadSummary(period)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {PERIOD_LABELS[period]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{PERIOD_LABELS[summaryPeriod]}总支出</Text>
          <Text style={styles.heroAmount}>{formatCurrency(total)}</Text>
          <Text style={styles.heroHint}>用卡片化结构查看主要支出类别与占比。</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>分类占比</Text>
          <Text style={styles.sectionCaption}>{summary.length} 个分类</Text>
        </View>

        {summary.map(item => {
          const category = CATEGORY_MAP[item.category];
          const percent = total > 0 ? Number(((item.total / total) * 100).toFixed(1)) : 0;

          return (
            <View key={item.category} style={styles.statCard}>
              <View style={styles.statTopRow}>
                <View style={styles.statTitleRow}>
                  <CategoryIcon categoryId={item.category} />
                  <View>
                    <Text style={styles.statTitle}>{category.label}</Text>
                    <Text style={styles.statCaption}>占总支出的 {percent}%</Text>
                  </View>
                </View>
                <Text style={styles.statAmount}>{formatCurrency(item.total)}</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressValue,
                    {
                      width: `${percent}%` as any,
                      backgroundColor: category.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}

        {summary.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{PERIOD_LABELS[summaryPeriod]}还没有统计数据</Text>
            <Text style={styles.emptyText}>先记几笔账单，统计页就会自动汇总你的消费分布。</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.successMuted,
  },
  headerBadgeText: {
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  segmented: {
    marginTop: spacing.xl,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.primaryMuted,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  heroCard: {
    marginTop: spacing.lg,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  heroAmount: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: '700',
  },
  heroHint: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '700',
  },
  sectionCaption: {
    color: colors.textTertiary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  statCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  statTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  statCaption: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  statAmount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: spacing.lg,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressValue: {
    height: '100%',
    minWidth: 8,
    borderRadius: radius.pill,
  },
  emptyState: {
    marginTop: spacing.xxl,
    padding: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
});
