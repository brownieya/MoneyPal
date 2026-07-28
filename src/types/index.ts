export type CategoryId =
  | 'uncategorized'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'daily'
  | 'clothing'
  | 'books'
  | 'phone'
  | 'housing'
  | 'travel'
  | 'game'
  | 'medical'
  | 'education'
  | 'entertainment'
  | 'transfer'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
  iconBackground: string;
}

export interface Transaction {
  id: number;
  amount: number;
  category: CategoryId;
  note: string;
  source: 'manual' | 'sms' | 'notification';
  raw: string;
  externalId: string;
  createdAt: string;
}

export interface TransactionFilter {
  categoryId?: CategoryId;
  startDate?: string;
  endDate?: string;
}

export type SummaryPeriod = 'week' | 'month' | 'year';

export interface SummaryItem {
  category: CategoryId;
  total: number;
}

export interface PaymentNotification {
  externalId: string;
  packageName: string;
  title: string;
  text: string;
  postedAt: string;
}

export type DebugLogLevel = 'info' | 'warn' | 'error';

export interface DebugLog {
  id: number;
  timestamp: string;
  source: string;
  level: DebugLogLevel;
  message: string;
}
