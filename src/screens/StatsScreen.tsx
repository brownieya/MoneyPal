import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTransactionStore } from '../store/useTransactionStore';
import { CATEGORY_MAP } from '../constants/categories';

export default function StatsScreen() {
  const { monthlySummary, loadSummary } = useTransactionStore();

  useEffect(() => { loadSummary(); }, []);

  const total = monthlySummary.reduce((sum, s) => sum + s.total, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>本月总支出</Text>
        <Text style={styles.cardAmount}>¥{(total / 100).toFixed(2)}</Text>
      </View>

      {monthlySummary.map(item => {
        const cat = CATEGORY_MAP[item.category as any];
        const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : '0';
        return (
          <View key={item.category} style={styles.row}>
            <Text style={styles.rowIcon}>{cat?.icon ?? '📦'}</Text>
            <Text style={styles.rowLabel}>{cat?.label ?? item.category}</Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${pct}%` as any, backgroundColor: cat?.color ?? '#ccc' }]} />
            </View>
            <Text style={styles.rowAmount}>¥{(item.total / 100).toFixed(2)}</Text>
          </View>
        );
      })}

      {monthlySummary.length === 0 && (
        <Text style={styles.empty}>本月暂无消费数据</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
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
