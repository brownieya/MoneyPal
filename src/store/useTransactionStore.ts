import { create } from 'zustand';
import {
  CategoryId,
  PaymentNotification,
  SummaryItem,
  SummaryPeriod,
  Transaction,
  TransactionFilter,
} from '../types';
import {
  deleteTransaction,
  deleteTransactions,
  getMonthlyBudget,
  getSummary,
  insertTransaction,
  queryTransactions,
  setMonthlyBudget as persistMonthlyBudget,
  updateTransactionCategory,
  updateTransactionNote,
} from '../database/db';
import { extractAmount, matchCategory } from '../utils/categoryMatcher';
import { writeDebugLog } from '../utils/debugLogger';

interface TransactionStore {
  transactions: Transaction[];
  selectedIds: Set<number>;
  filter: TransactionFilter;

  refresh: (filter?: TransactionFilter) => void;
  load: (filter?: TransactionFilter) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  toggleSelect: (id: number) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  deleteTransactionById: (id: number) => void;
  setFilter: (filter: TransactionFilter) => void;
  updateCategory: (id: number, category: CategoryId) => void;
  updateNote: (id: number, note: string) => void;
  importNotifications: (notifications: PaymentNotification[]) => number;

  summary: SummaryItem[];
  summaryPeriod: SummaryPeriod;
  loadSummary: (period?: SummaryPeriod) => void;
  monthlyBudget: number;
  loadMonthlyBudget: () => void;
  setMonthlyBudget: (amount: number) => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  selectedIds: new Set(),
  filter: {},
  summary: [],
  summaryPeriod: 'month',
  monthlyBudget: 500000,

  refresh: (filter?: TransactionFilter) => {
    const currentFilter = filter ?? get().filter;
    set({
      transactions: queryTransactions(currentFilter),
      filter: currentFilter,
      summary: getSummary(get().summaryPeriod),
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

  deleteTransactionById: (id) => {
    deleteTransaction(id);
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

    writeDebugLog('import', `start notification import count=${notifications.length}`);

    for (const notification of notifications) {
      try {
        const raw = [notification.title, notification.text].filter(Boolean).join('\n');
        const amount = extractAmount(raw);

        writeDebugLog(
          'parser',
          `notification received externalId=${notification.externalId} amount=${amount ?? 'none'} raw=${raw
            .replace(/\s+/g, ' ')
            .slice(0, 180)}`
        );

        if (!amount) {
          writeDebugLog('parser', `skipped: amount extraction failed externalId=${notification.externalId}`, 'warn');
          continue;
        }

        const category = matchCategory(raw);
        const result = insertTransaction({
          amount,
          category,
          note: notification.title || notification.packageName,
          source: 'notification',
          raw,
          externalId: notification.externalId,
          createdAt: notification.postedAt,
        });

        if (result > 0) {
          importedCount += 1;
          writeDebugLog(
            'database',
            `inserted transaction id=${result} amount=${amount} category=${category} externalId=${notification.externalId}`
          );
        } else {
          writeDebugLog(
            'database',
            `skipped duplicate or ignored transaction externalId=${notification.externalId}`,
            'warn'
          );
        }
      } catch (error) {
        writeDebugLog(
          'import',
          `failed notification externalId=${notification.externalId} error=${String(error)}`,
          'error'
        );
      }
    }

    if (importedCount > 0) {
      get().refresh();
    }

    writeDebugLog('import', `finish notification import importedCount=${importedCount}`);

    return importedCount;
  },

  loadSummary: (period) => {
    const currentPeriod = period ?? get().summaryPeriod;
    set({
      summary: getSummary(currentPeriod),
      summaryPeriod: currentPeriod,
    });
  },

  loadMonthlyBudget: () => {
    set({
      monthlyBudget: getMonthlyBudget(),
    });
  },

  setMonthlyBudget: (amount) => {
    persistMonthlyBudget(amount);
    set({
      monthlyBudget: amount,
    });
  },
}));
