import { Category, CategoryId } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'food',          label: '饮食',   icon: '🍜', color: '#FF6B6B' },
  { id: 'transport',     label: '交通',   icon: '🚇', color: '#4ECDC4' },
  { id: 'shopping',      label: '购物',   icon: '🛍️', color: '#45B7D1' },
  { id: 'game',          label: '游戏',   icon: '🎮', color: '#96CEB4' },
  { id: 'medical',       label: '医疗',   icon: '💊', color: '#FFEAA7' },
  { id: 'education',     label: '教育',   icon: '📚', color: '#DDA0DD' },
  { id: 'entertainment', label: '娱乐',   icon: '🎬', color: '#F0A500' },
  { id: 'transfer',      label: '转账',   icon: '💸', color: '#A8E6CF' },
  { id: 'other',         label: '其他',   icon: '📦', color: '#B0BEC5' },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
) as Record<CategoryId, Category>;

// 关键词自动分类规则（用于短信/通知解析）
export const CATEGORY_KEYWORDS: { keywords: string[]; category: CategoryId }[] = [
  { keywords: ['美团', '饿了么', '肯德基', 'KFC', '麦当劳', '星巴克', '瑞幸', '餐', '饭', '外卖', '奶茶', '咖啡'], category: 'food' },
  { keywords: ['滴滴', '高德', '地铁', '公交', '铁路', '火车', '飞机', '机票', '出行', '打车', '顺风车'], category: 'transport' },
  { keywords: ['淘宝', '天猫', '京东', '拼多多', '抖音', '快手', '购物', '超市', '沃尔玛', '大润发'], category: 'shopping' },
  { keywords: ['steam', 'Steam', '游戏', '网易', '腾讯游戏', '王者', '原神', '充值', '点券'], category: 'game' },
  { keywords: ['医院', '药店', '诊所', '挂号', '医疗', '药'], category: 'medical' },
  { keywords: ['培训', '课程', '学习', '教育', '网课', '作业帮', '猿辅导'], category: 'education' },
  { keywords: ['电影', '爱奇艺', '优酱', '腾讯视频', '哔哩哔哩', 'B站', 'KTV', '演出', '票'], category: 'entertainment' },
  { keywords: ['转账', '红包', '收款', '付款给'], category: 'transfer' },
];
