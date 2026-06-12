import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTransactionStore } from '../store/useTransactionStore';
import { CATEGORY_MAP } from '../constants/categories';
import { SummaryPeriod } from '../types';

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
  }, []);

  const total = summary.reduce((sum, item) => sum + item.total, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.segmented}>
        {PERIODS.map(period => (
          <Pressable
            key={period}
            style={[styles.segmentButton, summaryPeriod === period && styles.segmentButtonActive]}
            onPress={() => loadSummary(period)}
          >
            <Text style={[styles.segmentText, summaryPeriod === period && styles.segmentTextActive]}>
              {PERIOD_LABELS[period]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{PERIOD_LABELS[summaryPeriod]}总支出</Text>
        <Text style={styles.cardAmount}>¥{(total / 100).toFixed(2)}</Text>
      </View>

      {summary.map(item => {
        const cat = CATEGORY_MAP[item.category];
        const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : '0';
        return (
          <View key={item.category} style={styles.row}>
            <Text style={styles.rowIcon}>{cat?.icon ?? '馃摝'}</Text>
            <Text style={styles.rowLabel}>{cat?.label ?? item.category}</Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${pct}%` as any, backgroundColor: cat?.color ?? '#ccc' }]} />
            </View>
            <Text style={styles.rowAmount}>¥{(item.total / 100).toFixed(2)}</Text>
          </View>
        );
      })}

      {summary.length === 0 && (
        <Text style={styles.empty}>{PERIOD_LABELS[summaryPeriod]}暂无消费数据</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#E53935',
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#E53935', borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 20,
  },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  cardAmount: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 8,
  },
  rowIcon: { fontSize: 22, marginRight: 10 },
  rowLabel: { fontSize: 14, color: '#333', width: 48 },
  barWrap: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginHorizontal: 10 },
  bar: { height: 8, borderRadius: 4, minWidth: 4 },
  rowAmount: { fontSize: 14, color: '#333', fontWeight: '600', width: 72, textAlign: 'right' },
  empty: { textAlign: 'center', color: '#bbb', marginTop: 60, fontSize: 15 },
});
