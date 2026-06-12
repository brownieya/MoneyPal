import React, { useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { useTransactionStore } from '../store/useTransactionStore';
import {
  consumePendingNotifications,
  openNotificationAccessSettings,
  isNotificationAccessEnabled,
} from '../modules/notificationListener';
import { CategoryId, Transaction } from '../types';

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
  } =
    useTransactionStore();
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [notificationEnabled, setNotificationEnabled] = React.useState(true);
  const [draftNote, setDraftNote] = React.useState('');

  useEffect(() => { load(); }, []);

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
    if (selectedIds.size === 0) return;
    Alert.alert(
      '确认删除',
      `确定删除选中的 ${selectedIds.size} 条记录？`,
      [
        { text: '取消', style: 'cancel', onPress: clearSelection },
        { text: '删除', style: 'destructive', onPress: deleteSelected },
      ]
    );
  }, [clearSelection, deleteSelected, selectedIds]);

  const handleCategoryChange = useCallback((category: CategoryId) => {
    if (!editingTransaction) {
      return;
    }

    updateCategory(editingTransaction.id, category);
    setEditingTransaction({ ...editingTransaction, category });
  }, [editingTransaction, updateCategory]);

  const handleSaveNote = useCallback(() => {
    if (!editingTransaction) {
      return;
    }

    updateNote(editingTransaction.id, draftNote);
    setEditingTransaction({ ...editingTransaction, note: draftNote });
    Alert.alert('已保存', '备注已更新');
  }, [draftNote, editingTransaction, updateNote]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const cat = CATEGORY_MAP[item.category];
    const isSelected = selectedIds.has(item.id);
    const yuan = (item.amount / 100).toFixed(2);
    const date = new Date(item.createdAt).toLocaleDateString('zh-CN');

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
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
      {!notificationEnabled && (
        <View style={styles.permissionCard}>
          <View style={styles.permissionTextWrap}>
            <Text style={styles.permissionTitle}>通知读取未开启</Text>
            <Text style={styles.permissionText}>开启后，支付通知会自动补录到账单里。</Text>
          </View>
          <TouchableOpacity style={styles.permissionButton} onPress={openNotificationAccessSettings}>
            <Text style={styles.permissionButtonText}>去开启</Text>
          </TouchableOpacity>
        </View>
      )}
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

      <Modal
        animationType="slide"
        transparent
        visible={editingTransaction !== null}
        onRequestClose={() => setEditingTransaction(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingTransaction(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>编辑账单</Text>
            {editingTransaction && (
              <>
                <Text style={styles.modalAmount}>¥{(editingTransaction.amount / 100).toFixed(2)}</Text>
                <Text style={styles.modalRaw}>
                  {editingTransaction.raw || '这条记录没有原始通知内容'}
                </Text>
                <Text style={styles.modalSectionTitle}>备注</Text>
                <TextInput
                  style={styles.noteInput}
                  value={draftNote}
                  onChangeText={setDraftNote}
                  placeholder="添加备注"
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                  <Text style={styles.saveButtonText}>保存备注</Text>
                </TouchableOpacity>
                <Text style={styles.modalSectionTitle}>分类</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(category => {
                    const isActive = category.id === editingTransaction.category;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryItem,
                          isActive && { backgroundColor: category.color, borderColor: category.color },
                        ]}
                        onPress={() => handleCategoryChange(category.id)}
                      >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  permissionCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF4E5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionTextWrap: { flex: 1, paddingRight: 12 },
  permissionTitle: { fontSize: 15, fontWeight: '700', color: '#8A5A00' },
  permissionText: { fontSize: 12, color: '#8A5A00', marginTop: 4, lineHeight: 18 },
  permissionButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: { color: '#fff', fontWeight: '700' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  modalAmount: { fontSize: 28, fontWeight: '700', color: '#E53935', marginTop: 12 },
  modalRaw: { fontSize: 13, color: '#666', marginTop: 8, lineHeight: 20 },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 18, marginBottom: 8 },
  noteInput: {
    minHeight: 84,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#E53935',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { marginTop: 4, fontSize: 12, color: '#555' },
  categoryLabelActive: { color: '#fff', fontWeight: '700' },
});
