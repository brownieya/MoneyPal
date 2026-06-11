import { create } from 'zustand';
import { Transaction, TransactionFilter, CategoryId } from '../types';
import {
  queryTransactions,
  insertTransaction,
  deleteTransactions,
  getMonthlySummary,
} from '../database/db';

interface TransactionStore {
  transactions: Transaction[];
  selectedIds: Set<number>;
  filter: TransactionFilter;

  // Actions
  load: (filter?: TransactionFilter) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  toggleSelect: (id: number) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  setFilter: (filter: TransactionFilter) => void;

  // Stats
  monthlySummary: { category: string; total: number }[];
  loadSummary: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  selectedIds: new Set(),
  filter: {},
  monthlySummary: [],

  load: (filter) => {
    const f = filter ?? get().filter;
    const transactions = queryTransactions(f);
    set({ transactions, filter: f });
  },

  addTransaction: (tx) => {
    insertTransaction(tx);
    get().load();
  },

  toggleSelect: (id) => {
    const selectedIds = new Set(get().selectedIds);
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    set({ selectedIds });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  deleteSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    deleteTransactions(Array.from(selectedIds));
    set({ selectedIds: new Set() });
    get().load();
  },

  setFilter: (filter) => {
    get().load(filter);
  },

  loadSummary: () => {
    const monthlySummary = getMonthlySummary();
    set({ monthlySummary });
  },
}));
