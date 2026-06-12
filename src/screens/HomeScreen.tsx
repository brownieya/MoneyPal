import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CategoryIcon from '../components/CategoryIcon';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import {
  consumePendingNotifications,
  isNotificationAccessEnabled,
  openNotificationAccessSettings,
} from '../modules/notificationListener';
import { useTransactionStore } from '../store/useTransactionStore';
import { CategoryId, Transaction } from '../types';
import { colors, radius, shadows, spacing, typography } from '../theme/tokens';
import {
  formatCompactDate,
  formatCurrency,
  formatDaySectionTitle,
  formatTime,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from '../utils/formatters';

type ListMode = 'all' | 'week' | 'month';

type TransactionSection = {
  title: string;
  data: Transaction[];
};

const LIST_MODES: { key: ListMode; label: string }[] = [
  { key: 'all', label: '全部账单' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
];

export default function HomeScreen() {
  const {
    transactions,
    selectedIds,
    load,
    toggleSelect,
    clearSelection,
    deleteSelected,
    updateCategory,
    updateNote,
    importNotifications,
  } = useTransactionStore();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [draftNote, setDraftNote] = useState('');
  const [listMode, setListMode] = useState<ListMode>('month');

  useEffect(() => {
    load();
  }, [load]);

  const checkNotificationPermission = useCallback(async () => {
    const enabled = await isNotificationAccessEnabled();
    setNotificationEnabled(enabled);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      void checkNotificationPermission();
      void consumePendingNotifications().then(importNotifications);
    }, [checkNotificationPermission, importNotifications, load])
  );

  const handleDelete = useCallback(() => {
    if (selectedIds.size === 0) {
      return;
    }

    Alert.alert('确认删除', `确定删除选中的 ${selectedIds.size} 条记录吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: deleteSelected },
    ]);
  }, [deleteSelected, selectedIds]);

  const handleCategoryChange = useCallback(
    (category: CategoryId) => {
      if (!editingTransaction) {
        return;
      }

      updateCategory(editingTransaction.id, category);
      setEditingTransaction({ ...editingTransaction, category });
    },
    [editingTransaction, updateCategory]
  );

  const handleSaveNote = useCallback(() => {
    if (!editingTransaction) {
      return;
    }

    updateNote(editingTransaction.id, draftNote);
    setEditingTransaction({ ...editingTransaction, note: draftNote });
    Alert.alert('已保存', '备注已更新。');
  }, [draftNote, editingTransaction, updateNote]);

  const monthStart = startOfMonth();
  const weekStart = startOfWeek();
  const todayStart = startOfToday();

  const monthTransactions = transactions.filter(item => new Date(item.createdAt) >= monthStart);
  const weekTransactions = transactions.filter(item => new Date(item.createdAt) >= weekStart);
  const todayTransactions = transactions.filter(item => new Date(item.createdAt) >= todayStart);

  const visibleTransactions =
    listMode === 'week'
      ? weekTransactions
      : listMode === 'month'
        ? monthTransactions
        : transactions;

  const monthTotal = monthTransactions.reduce((sum, item) => sum + item.amount, 0);
  const todayTotal = todayTransactions.reduce((sum, item) => sum + item.amount, 0);
  const averageDailySpend =
    monthTransactions.length === 0
      ? 0
      : Math.round(monthTotal / Math.max(new Date().getDate(), 1));

  const categoryTotals: Record<string, number> = {};

  monthTransactions.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + item.amount;
  });

  const topCategoryId =
    Object.entries(categoryTotals).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'other';
  const topCategory = CATEGORY_MAP[topCategoryId as CategoryId];

  const sections: TransactionSection[] = [];

  visibleTransactions.forEach(item => {
    const title = formatDaySectionTitle(item.createdAt);
    const lastSection = sections[sections.length - 1];

    if (!lastSection || lastSection.title !== title) {
      sections.push({
        title,
        data: [item],
      });
      return;
    }

    lastSection.data.push(item);
  });

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = CATEGORY_MAP[item.category];
    const isSelected = selectedIds.has(item.id);
    const noteText = item.note || item.raw || '暂无备注';

    return (
      <TouchableOpacity
        style={[styles.transactionCard, isSelected && styles.transactionCardSelected]}
        activeOpacity={0.88}
        onLongPress={() => toggleSelect(item.id)}
        onPress={() => {
          if (selectedIds.size > 0) {
            toggleSelect(item.id);
            return;
          }

          setEditingTransaction(item);
          setDraftNote(item.note);
        }}
      >
        <CategoryIcon categoryId={item.category} />
        <View style={styles.transactionBody}>
          <View style={styles.transactionTopRow}>
            <Text style={styles.transactionTitle}>{category.label}</Text>
            <Text style={styles.transactionAmount}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.transactionBottomRow}>
            <Text style={styles.transactionNote} numberOfLines={1}>
              {noteText}
            </Text>
            <Text style={styles.transactionMeta}>
              {formatCompactDate(item.createdAt)} {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <SectionList
        style={styles.container}
        sections={sections}
        keyExtractor={item => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerEyebrow}>MoneyPal</Text>
                <Text style={styles.headerTitle}>极简账单总览</Text>
              </View>
              <View style={styles.headerBadge}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.headerBadgeText}>可信记录</Text>
              </View>
            </View>

            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>本月支出</Text>
              <Text style={styles.heroAmount}>{formatCurrency(monthTotal)}</Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>今日支出</Text>
                  <Text style={styles.heroStatValue}>{formatCurrency(todayTotal)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatLabel}>日均支出</Text>
                  <Text style={styles.heroStatValue}>{formatCurrency(averageDailySpend)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.insightRow}>
              <View style={[styles.insightCard, styles.insightCardLarge]}>
                <Text style={styles.insightLabel}>本月重点分类</Text>
                <View style={styles.insightCategoryRow}>
                  <CategoryIcon categoryId={topCategory.id} size={16} />
                  <View>
                    <Text style={styles.insightValue}>{topCategory.label}</Text>
                    <Text style={styles.insightSubValue}>
                      {monthTransactions.length > 0 ? formatCurrency(categoryTotals[topCategory.id]) : '暂无数据'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>通知导入</Text>
                <Text style={styles.insightValue}>{notificationEnabled ? '已开启' : '待开启'}</Text>
                <Text style={styles.insightSubValue}>
                  {notificationEnabled ? '支付通知会自动补录' : '建议开启自动记账'}
                </Text>
              </View>
            </View>

            {!notificationEnabled && (
              <Pressable style={styles.permissionCard} onPress={openNotificationAccessSettings}>
                <View style={styles.permissionCopy}>
                  <Text style={styles.permissionTitle}>开启通知读取</Text>
                  <Text style={styles.permissionText}>连接支付通知后，MoneyPal 会自动补录账单。</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            )}

            <View style={styles.billHeader}>
              <View>
                <Text style={styles.billTitle}>账单中心</Text>
                <Text style={styles.billSubtitle}>按时间整理，适合快速检查与编辑</Text>
              </View>
              <Text style={styles.billCount}>{visibleTransactions.length} 条</Text>
            </View>

            <View style={styles.filterRow}>
              {LIST_MODES.map(mode => {
                const active = listMode === mode.key;

                return (
                  <Pressable
                    key={mode.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setListMode(mode.key)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedIds.size > 0 && (
              <View style={styles.selectionBar}>
                <Text style={styles.selectionText}>已选中 {selectedIds.size} 条</Text>
                <View style={styles.selectionActions}>
                  <Pressable style={styles.selectionButton} onPress={clearSelection}>
                    <Text style={styles.selectionButtonText}>取消</Text>
                  </Pressable>
                  <Pressable style={[styles.selectionButton, styles.selectionDanger]} onPress={handleDelete}>
                    <Text style={[styles.selectionButtonText, styles.selectionDangerText]}>删除</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        }
        renderItem={renderTransaction}
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>还没有账单记录</Text>
            <Text style={styles.emptyText}>可以先手动记一笔，或者开启通知读取自动导入。</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
        visible={editingTransaction !== null}
        onRequestClose={() => setEditingTransaction(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingTransaction(null)}>
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑账单</Text>
              <Pressable onPress={() => setEditingTransaction(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {editingTransaction && (
              <>
                <Text style={styles.modalAmount}>{formatCurrency(editingTransaction.amount)}</Text>
                <Text style={styles.modalRaw} numberOfLines={3}>
                  {editingTransaction.raw || '这条记录没有原始通知内容。'}
                </Text>

                <Text style={styles.modalSectionTitle}>备注</Text>
                <TextInput
                  style={styles.noteInput}
                  value={draftNote}
                  onChangeText={setDraftNote}
                  placeholder="补充这笔消费的备注"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveNote} activeOpacity={0.88}>
                  <Text style={styles.primaryButtonText}>保存备注</Text>
                </TouchableOpacity>

                <Text style={styles.modalSectionTitle}>分类</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(category => {
                    const isActive = category.id === editingTransaction.category;

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[styles.categoryCard, isActive && styles.categoryCardActive]}
                        activeOpacity={0.88}
                        onPress={() => handleCategoryChange(category.id)}
                      >
                        <CategoryIcon categoryId={category.id} />
                        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: colors.primaryMuted,
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  heroCard: {
    marginTop: spacing.xl,
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
  heroStats: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
  },
  heroStatLabel: {
    color: colors.textTertiary,
    fontSize: typography.caption,
  },
  heroStatValue: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '700',
  },
  insightRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  insightCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  insightCardLarge: {
    flex: 1.2,
  },
  insightLabel: {
    color: colors.textTertiary,
    fontSize: typography.caption,
  },
  insightCategoryRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightValue: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  insightSubValue: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  permissionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  permissionText: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  billHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  billTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '700',
  },
  billSubtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  billCount: {
    color: colors.textTertiary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primaryMuted,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  selectionBar: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  selectionButtonText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  selectionDanger: {
    backgroundColor: colors.dangerMuted,
  },
  selectionDangerText: {
    color: colors.danger,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    color: colors.textTertiary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  transactionCard: {
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  transactionCardSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#F8FBFF',
  },
  transactionBody: {
    flex: 1,
  },
  transactionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  transactionAmount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  transactionBottomRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  transactionNote: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  transactionMeta: {
    color: colors.textTertiary,
    fontSize: typography.caption,
  },
  emptyState: {
    marginTop: 72,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalCard: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: '700',
  },
  modalAmount: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  modalRaw: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  modalSectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 88,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.body,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: spacing.md,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '23%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryCardActive: {
    backgroundColor: colors.primaryMuted,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.primary,
  },
});
