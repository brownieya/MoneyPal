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
import { AppTheme, useAppTheme } from '../theme/tokens';
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

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const {
    transactions,
    selectedIds,
    load,
    toggleSelect,
    clearSelection,
    deleteSelected,
    deleteTransactionById,
    updateCategory,
    updateNote,
    importNotifications,
    monthlyBudget,
    loadMonthlyBudget,
    setMonthlyBudget,
  } = useTransactionStore();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [draftNote, setDraftNote] = useState('');
  const [listMode, setListMode] = useState<ListMode>('month');
  const [budgetInput, setBudgetInput] = useState('');

  useEffect(() => {
    load();
    loadMonthlyBudget();
  }, [load, loadMonthlyBudget]);

  useEffect(() => {
    setBudgetInput(monthlyBudget > 0 ? String(monthlyBudget / 100) : '');
  }, [monthlyBudget]);

  const checkNotificationPermission = useCallback(async () => {
    const enabled = await isNotificationAccessEnabled();
    setNotificationEnabled(enabled);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      loadMonthlyBudget();
      void checkNotificationPermission();
      void consumePendingNotifications().then(importNotifications);
    }, [checkNotificationPermission, importNotifications, load, loadMonthlyBudget])
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

  const handleDeleteCurrent = useCallback(() => {
    if (!editingTransaction) {
      return;
    }

    Alert.alert('删除这条账单', '删除后将无法恢复，是否继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          deleteTransactionById(editingTransaction.id);
          setEditingTransaction(null);
        },
      },
    ]);
  }, [deleteTransactionById, editingTransaction]);

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

  const baseTransactions =
    listMode === 'week'
      ? weekTransactions
      : listMode === 'month'
        ? monthTransactions
        : transactions;

  const visibleTransactions = baseTransactions;

  const monthTotal = monthTransactions.reduce((sum, item) => sum + item.amount, 0);
  const todayTotal = todayTransactions.reduce((sum, item) => sum + item.amount, 0);
  const weekTotal = weekTransactions.reduce((sum, item) => sum + item.amount, 0);
  const averageDailySpend =
    monthTransactions.length === 0
      ? 0
      : Math.round(monthTotal / Math.max(new Date().getDate(), 1));

  const remainingBudget = Math.max(monthlyBudget - monthTotal, 0);
  const budgetPercent = monthlyBudget > 0 ? Math.min(monthTotal / monthlyBudget, 1) : 0;

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

  const weekTrendStart = startOfWeek();
  const weekTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekTrendStart);
    date.setDate(weekTrendStart.getDate() + index);
    const total = transactions.reduce((sum, item) => {
      const createdAt = new Date(item.createdAt);
      const sameDay =
        createdAt.getFullYear() === date.getFullYear() &&
        createdAt.getMonth() === date.getMonth() &&
        createdAt.getDate() === date.getDate();

      return sameDay ? sum + item.amount : sum;
    }, 0);

    return {
      label: WEEK_LABELS[index],
      total,
    };
  });

  const highestWeekValue = Math.max(...weekTrend.map(item => item.total), 1);

  const handleBudgetSave = useCallback(() => {
    const amount = Number(budgetInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('预算金额不正确', '请输入大于 0 的月预算金额。');
      return;
    }

    setMonthlyBudget(Math.round(amount * 100));
    Alert.alert('预算已更新', `本月预算已设置为 ¥${amount.toFixed(2)}。`);
  }, [budgetInput, setMonthlyBudget]);

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
                <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.primary} />
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
                <View style={[styles.heroStatItem, styles.heroStatItemRight]}>
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

            <View style={styles.trendCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>本周趋势</Text>
                  <Text style={styles.cardSubtitle}>本周累计 {formatCurrency(weekTotal)}</Text>
                </View>
                <View style={styles.cardBadge}>
                  <Ionicons name="trending-up-outline" size={14} color={theme.colors.success} />
                  <Text style={styles.cardBadgeText}>7 天</Text>
                </View>
              </View>

              <View style={styles.weekTrendWrap}>
                {weekTrend.map(item => (
                  <View key={item.label} style={styles.weekColumn}>
                    <View style={styles.weekBarTrack}>
                      <View
                        style={[
                          styles.weekBarValue,
                          {
                            height: `${Math.max((item.total / highestWeekValue) * 100, item.total > 0 ? 12 : 0)}%` as any,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.weekValue}>{item.total > 0 ? Math.round(item.total / 100) : 0}</Text>
                    <Text style={styles.weekLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.budgetCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>预算进度</Text>
                  <Text style={styles.cardSubtitle}>
                    本月预算 {formatCurrency(monthlyBudget)}，剩余 {formatCurrency(remainingBudget)}
                  </Text>
                </View>
                <Text style={styles.budgetPercent}>{Math.round(budgetPercent * 100)}%</Text>
              </View>

              <View style={styles.budgetTrack}>
                <View style={[styles.budgetValue, { width: `${budgetPercent * 100}%` as any }]} />
              </View>

              <View style={styles.budgetInputRow}>
                <View style={styles.budgetInputWrap}>
                  <Text style={styles.budgetCurrency}>¥</Text>
                  <TextInput
                    style={styles.budgetInput}
                    value={budgetInput}
                    onChangeText={setBudgetInput}
                    keyboardType="decimal-pad"
                    placeholder="输入本月预算"
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
                <Pressable style={styles.budgetSaveButton} onPress={handleBudgetSave}>
                  <Text style={styles.budgetSaveButtonText}>保存</Text>
                </Pressable>
              </View>
            </View>

            {!notificationEnabled && (
              <Pressable style={styles.permissionCard} onPress={openNotificationAccessSettings}>
                <View style={styles.permissionCopy}>
                  <Text style={styles.permissionTitle}>开启通知读取</Text>
                  <Text style={styles.permissionText}>连接支付通知后，MoneyPal 会自动补录账单。</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
              </Pressable>
            )}

            <View style={styles.billHeader}>
              <View>
                <Text style={styles.billTitle}>账单中心</Text>
                <Text style={styles.billSubtitle}>支持时间筛选与底部抽屉编辑</Text>
              </View>
              <View style={styles.billHeaderActions}>
                <Text style={styles.billCount}>{visibleTransactions.length} 条</Text>
                {selectedIds.size > 0 && (
                  <Pressable onPress={handleDelete}>
                    <Text style={styles.billDeleteText}>删除</Text>
                  </Pressable>
                )}
              </View>
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
            <Ionicons name="receipt-outline" size={24} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>当前筛选下还没有账单</Text>
            <Text style={styles.emptyText}>可以切换筛选条件，或者先记一笔新账单。</Text>
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
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>编辑账单</Text>
                {editingTransaction && (
                  <View style={styles.modalMetaRow}>
                    <View style={styles.modalMetaBadge}>
                      <Text style={styles.modalMetaText}>
                        {editingTransaction.source === 'notification' ? '自动导入' : '手动录入'}
                      </Text>
                    </View>
                    <Text style={styles.modalTimeText}>
                      {formatCompactDate(editingTransaction.createdAt)} {formatTime(editingTransaction.createdAt)}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => setEditingTransaction(null)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {editingTransaction && (
              <>
                <View style={styles.modalAmountRow}>
                  <CategoryIcon categoryId={editingTransaction.category} />
                  <View style={styles.modalAmountCopy}>
                    <Text style={styles.modalAmount}>{formatCurrency(editingTransaction.amount)}</Text>
                    <Text style={styles.modalAmountHint}>分类可在下方直接切换，备注支持即时更新。</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>备注</Text>
                <TextInput
                  style={styles.noteInput}
                  value={draftNote}
                  onChangeText={setDraftNote}
                  placeholder="补充这笔消费的备注"
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                />

                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSaveNote} activeOpacity={0.88}>
                    <Text style={styles.primaryButtonText}>保存备注</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleDeleteCurrent}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.secondaryButtonText}>删除账单</Text>
                  </TouchableOpacity>
                </View>

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

                <Text style={styles.modalSectionTitle}>原始信息</Text>
                <View style={styles.rawCard}>
                  <Text style={styles.rawText}>
                    {editingTransaction.raw || '这条记录没有原始通知内容，属于手动录入账单。'}
                  </Text>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
    },
    header: {
      marginTop: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerEyebrow: {
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
      fontWeight: '600',
    },
    headerTitle: {
      marginTop: theme.spacing.xs,
      color: theme.colors.text,
      fontSize: theme.typography.title,
      fontWeight: '700',
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryMuted,
    },
    headerBadgeText: {
      color: theme.colors.primary,
      fontSize: theme.typography.caption,
      fontWeight: '700',
    },
    heroCard: {
      marginTop: theme.spacing.xl,
      padding: theme.spacing.xxl,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
      ...theme.shadows,
    },
    heroLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
    },
    heroAmount: {
      marginTop: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.hero,
      fontWeight: '700',
    },
    heroStats: {
      marginTop: theme.spacing.xxl,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroStatItem: {
      flex: 1,
    },
    heroStatItemRight: {
      paddingLeft: theme.spacing.lg,
    },
    heroDivider: {
      width: 1,
      height: 34,
      backgroundColor: theme.colors.border,
    },
    heroStatLabel: {
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
    },
    heroStatValue: {
      marginTop: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: theme.typography.section,
      fontWeight: '700',
    },
    insightRow: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    insightCard: {
      flex: 1,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    insightCardLarge: {
      flex: 1.2,
    },
    insightLabel: {
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
    },
    insightCategoryRow: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    insightValue: {
      marginTop: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    insightSubValue: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      lineHeight: 18,
    },
    trendCard: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.section,
      fontWeight: '700',
    },
    cardSubtitle: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      lineHeight: 18,
    },
    cardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.successMuted,
    },
    cardBadgeText: {
      color: theme.colors.success,
      fontSize: theme.typography.caption,
      fontWeight: '700',
    },
    weekTrendWrap: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      height: 150,
    },
    weekColumn: {
      flex: 1,
      alignItems: 'center',
    },
    weekBarTrack: {
      width: '100%',
      flex: 1,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.chartTrack,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    weekBarValue: {
      width: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      minHeight: 0,
    },
    weekValue: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    weekLabel: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
      fontWeight: '600',
    },
    budgetCard: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    budgetPercent: {
      color: theme.colors.text,
      fontSize: theme.typography.section,
      fontWeight: '700',
    },
    budgetTrack: {
      marginTop: theme.spacing.lg,
      height: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.chartTrack,
      overflow: 'hidden',
    },
    budgetValue: {
      height: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
      minWidth: 10,
    },
    budgetInputRow: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    budgetInputWrap: {
      flex: 1,
      minHeight: 46,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
      flexDirection: 'row',
      alignItems: 'center',
    },
    budgetCurrency: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    budgetInput: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      paddingVertical: 0,
      marginLeft: theme.spacing.sm,
    },
    budgetSaveButton: {
      minWidth: 72,
      minHeight: 46,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    budgetSaveButtonText: {
      color: theme.colors.surface,
      fontSize: theme.typography.body,
      fontWeight: '700',
    },
    permissionCard: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primaryMuted,
      flexDirection: 'row',
      alignItems: 'center',
    },
    permissionCopy: {
      flex: 1,
      paddingRight: theme.spacing.md,
    },
    permissionTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    permissionText: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      lineHeight: 18,
    },
    billHeader: {
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    billHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    billTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.section,
      fontWeight: '700',
    },
    billSubtitle: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
    },
    billCount: {
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
      fontWeight: '600',
    },
    billDeleteText: {
      color: theme.colors.danger,
      fontSize: theme.typography.caption,
      fontWeight: '700',
    },
    filterRow: {
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primaryMuted,
    },
    filterChipText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      fontWeight: '600',
    },
    filterChipTextActive: {
      color: theme.colors.primary,
    },
    selectionBar: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectionText: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: '700',
    },
    selectionActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    selectionButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
    },
    selectionButtonText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      fontWeight: '700',
    },
    selectionDanger: {
      backgroundColor: theme.colors.dangerMuted,
    },
    selectionDangerText: {
      color: theme.colors.danger,
    },
    sectionTitle: {
      marginBottom: theme.spacing.sm,
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
      fontWeight: '700',
    },
    transactionCard: {
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    transactionCardSelected: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.selectionSurface,
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
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    transactionAmount: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    transactionBottomRow: {
      marginTop: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    transactionNote: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
    },
    transactionMeta: {
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
    },
    emptyState: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.xxl,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    emptyTitle: {
      marginTop: theme.spacing.md,
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    emptyText: {
      marginTop: theme.spacing.sm,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      lineHeight: 22,
      textAlign: 'center',
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
    },
    modalCard: {
      padding: theme.spacing.xxl,
      paddingBottom: theme.spacing.xxxl,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: theme.colors.surface,
    },
    handle: {
      alignSelf: 'center',
      width: 48,
      height: 5,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.border,
      marginBottom: theme.spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    modalTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.section,
      fontWeight: '700',
    },
    modalMetaRow: {
      marginTop: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    modalMetaBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceMuted,
    },
    modalMetaText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      fontWeight: '700',
    },
    modalTimeText: {
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
    },
    modalAmountRow: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    modalAmountCopy: {
      flex: 1,
    },
    modalAmount: {
      color: theme.colors.text,
      fontSize: theme.typography.title,
      fontWeight: '700',
    },
    modalAmountHint: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      lineHeight: 18,
    },
    modalSectionTitle: {
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: '700',
    },
    noteInput: {
      minHeight: 88,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      textAlignVertical: 'top',
    },
    modalActionRow: {
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    primaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: theme.colors.surface,
      fontSize: theme.typography.body,
      fontWeight: '700',
    },
    secondaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dangerMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: theme.colors.danger,
      fontSize: theme.typography.body,
      fontWeight: '700',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '22.5%',
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    categoryCardActive: {
      backgroundColor: theme.colors.primaryMuted,
    },
    categoryText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      fontWeight: '600',
    },
    categoryTextActive: {
      color: theme.colors.primary,
    },
    rawCard: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
    rawText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.body,
      lineHeight: 22,
    },
  });
}
