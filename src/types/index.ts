export type CategoryId =
  | 'uncategorized'
  | 'food'
  | 'transport'
  | 'shopping'
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
}

export interface Transaction {
  id: number;
  amount: number;          // 金额（分），避免浮点问题
  category: CategoryId;
  note: string;
  source: 'manual' | 'sms' | 'notification';
  raw: string;             // 原始短信/通知内容
  externalId: string;      // 原生通知唯一标识，用于去重
  createdAt: string;       // ISO 8601
}

export interface TransactionFilter {
  categoryId?: CategoryId;
  startDate?: string;
  endDate?: string;
}

export interface MonthlySummary {
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
