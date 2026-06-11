import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { useTransactionStore } from '../store/useTransactionStore';
import { CATEGORY_MAP } from '../constants/categories';
import { Transaction } from '../types';

export default function HomeScreen() {
  const { transactions, selectedIds, load, toggleSelect, clearSelection, deleteSelected } =
    useTransactionStore();

  useEffect(() => { load(); }, []);

  const handleDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      '确认删除',
      `确定删除选中的 ${selectedIds.size} 条记录？`,
      [
        { text: '取消', style: 'cancel', onPress: clearSelection },
        { text: '删除', style: 'destructive', onPress: deleteSelected },
      ]
    );
  }, [selectedIds]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const cat = CATEGORY_MAP[item.category];
    const isSelected = selectedIds.has(item.id);
    const yuan = (item.amount / 100).toFixed(2);
    const date = new Date(item.createdAt).toLocaleDateString('zh-CN');

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onLongPress={() => toggleSelect(item.id)}
        onPress={() => selectedIds.size > 0 && toggleSelect(item.id)}
      >
        <Text style={styles.icon}>{cat?.icon ?? '📦'}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemLabel}>{cat?.label ?? '其他'}</Text>
          <Text style={styles.itemNote} numberOfLines={1}>{item.note || item.raw || '无备注'}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemAmount}>-¥{yuan}</Text>
          <Text style={styles.itemDate}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {selectedIds.size > 0 && (
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={clearSelection}>
            <Text style={styles.toolbarBtn}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.toolbarTitle}>已选 {selectedIds.size} 条</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={[styles.toolbarBtn, styles.deleteBtn]}>删除</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={transactions}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>暂无消费记录{'\n'}长按记录可选择删除</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 10,
  },
  toolbarBtn: { color: '#fff', fontSize: 16 },
  toolbarTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: { color: '#FF6B6B' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8,
    borderRadius: 10, padding: 14,
  },
  itemSelected: { backgroundColor: '#FFE0E0' },
  icon: { fontSize: 28, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemNote: { fontSize: 12, color: '#999', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#E53935' },
  itemDate: { fontSize: 11, color: '#bbb', marginTop: 2 },
  empty: { textAlign: 'center', color: '#bbb', marginTop: 80, fontSize: 15, lineHeight: 26 },
});
