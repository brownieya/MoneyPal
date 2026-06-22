import { CategoryId } from '../types';
import { CATEGORY_KEYWORDS } from '../constants/categories';

export function matchCategory(text: string): CategoryId {
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some(keyword => text.includes(keyword))) {
      return rule.category;
    }
  }

  return 'uncategorized';
}

export function extractAmount(text: string): number | null {
  const normalized = text.replace(/,/g, '');
  const patterns = [
    /(?:人民币|RMB|CNY|¥|￥|金额)[^\d]{0,8}(\d+(?:\.\d{1,2})?)/i,
    /(?:支付|付款|消费|支出|扣款|收款|到账)[^\d]{0,8}(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*元/,
    /(\d+(?:\.\d{1,2})?)\s*(?:USD|usd)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }

    const amount = Number.parseFloat(match[1]);
    if (Number.isFinite(amount) && amount > 0) {
      return Math.round(amount * 100);
    }
  }

  return null;
}
