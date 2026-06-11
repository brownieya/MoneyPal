import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useTransactionStore } from '../store/useTransactionStore';
import { CATEGORIES } from '../constants/categories';
import { CategoryId } from '../types';

export default function AddScreen() {
  const { addTransaction } = useTransactionStore();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryId>('other');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const yuan = parseFloat(amount);
    if (isNaN(yuan) || yuan <= 0) {
      Alert.alert('提示', '请输入正确的金额');
      return;
    }
    addTransaction({
      amount: Math.round(yuan * 100),
      category,
      note,
      source: 'manual',
      raw: '',
      createdAt: new Date().toISOString(),
    });
    setAmount('');
    setNote('');
    setCategory('other');
    Alert.alert('已添加', `¥${yuan.toFixed(2)} 已记录`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>金额（元）</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#ccc"
        />

        <Text style={styles.label}>分类</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catItem, category === cat.id && { backgroundColor: cat.color }]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>备注（可选）</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          placeholder="添加备注..."
          placeholderTextColor="#ccc"
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>记一笔</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  label: { fontSize: 14, color: '#666', marginTop: 20, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 18, color: '#333',
  },
  noteInput: { height: 80, textAlignVertical: 'top', fontSize: 15 },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  catItem: {
    width: '22%', alignItems: 'center', paddingVertical: 10,
    backgroundColor: '#fff', borderRadius: 10,
  },
  catIcon: { fontSize: 22 },
  catLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  catLabelActive: { color: '#fff', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#E53935', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 30, marginBottom: 40,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
