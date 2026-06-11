import { create } from 'zustand';
import {
  CategoryId,
  MonthlySummary,
  PaymentNotification,
  Transaction,
  TransactionFilter,
} from '../types';
import {
  deleteTransactions,
  getMonthlySummary,
  insertTransaction,
  queryTransactions,
  updateTransactionCategory,
  updateTransactionNote,
} from '../database/db';
import { extractAmount, matchCategory } from '../utils/categoryMatcher';

interface TransactionStore {
  transactions: Transaction[];
  selectedIds: Set<number>;
  filter: TransactionFilter;

  // Actions
  refresh: (filter?: TransactionFilter) => void;
  load: (filter?: TransactionFilter) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  toggleSelect: (id: number) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  setFilter: (filter: TransactionFilter) => void;
  updateCategory: (id: number, category: CategoryId) => void;
  updateNote: (id: number, note: string) => void;
  importNotifications: (notifications: PaymentNotification[]) => number;

  // Stats
  monthlySummary: MonthlySummary[];
  loadSummary: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  selectedIds: new Set(),
  filter: {},
  monthlySummary: [],

  refresh: (filter?: TransactionFilter) => {
    const currentFilter = filter ?? get().filter;
    set({
      transactions: queryTransactions(currentFilter),
      filter: currentFilter,
      monthlySummary: getMonthlySummary(),
    });
  },

  load: (filter) => {
    get().refresh(filter);
  },

  addTransaction: (tx) => {
    insertTransaction(tx);
    get().refresh();
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
    get().refresh();
  },

  setFilter: (filter) => {
    get().load(filter);
  },

  updateCategory: (id, category) => {
    updateTransactionCategory(id, category);
    get().refresh();
  },

  updateNote: (id, note) => {
    updateTransactionNote(id, note);
    get().refresh();
  },

  importNotifications: (notifications) => {
    let importedCount = 0;

    for (const notification of notifications) {
      const raw = [notification.title, notification.text].filter(Boolean).join('\n');
      const amount = extractAmount(raw);

      if (!amount) {
        continue;
      }

      const result = insertTransaction({
        amount,
        category: matchCategory(raw),
        note: notification.title || notification.packageName,
        source: 'notification',
        raw,
        externalId: notification.externalId,
        createdAt: notification.postedAt,
      });

      if (result > 0) {
        importedCount += 1;
      }
    }

    if (importedCount > 0) {
      get().refresh();
    }

    return importedCount;
  },

  loadSummary: () => {
    const monthlySummary = getMonthlySummary();
    set({ monthlySummary });
  },
}));
