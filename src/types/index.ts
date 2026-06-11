export type CategoryId =
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
  createdAt: string;       // ISO 8601
}

export interface TransactionFilter {
  categoryId?: CategoryId;
  startDate?: string;
  endDate?: string;
}
