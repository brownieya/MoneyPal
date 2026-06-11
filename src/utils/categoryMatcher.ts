import { CategoryId } from '../types';
import { CATEGORY_KEYWORDS } from '../constants/categories';

/**
 * 根据文本内容自动匹配消费分类
 * 优先返回第一个匹配的分类，无匹配则返回 'other'
 */
export function matchCategory(text: string): CategoryId {
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.category;
    }
  }
  return 'other';
}

/**
 * 从短信内容中提取金额（元），返回分为单位的整数
 * 支持格式：人民币12.50元 / ¥12.50 / 金额12.50元
 */
export function extractAmount(text: string): number | null {
  const patterns = [
    /(?:人民币|rmb|¥|金额)[^\d]*(\d+\.?\d*)/i,
    /(\d+\.?\d*)元/,
    /共消费(\d+\.?\d*)/,
    /扣款(\d+\.?\d*)/,
    /支出(\d+\.?\d*)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return Math.round(parseFloat(match[1]) * 100);
    }
  }
  return null;
}
