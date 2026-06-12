import { Category, CategoryId } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'uncategorized', label: '待分类', icon: 'help-circle-outline', color: '#64748B', iconBackground: '#E2E8F0' },
  { id: 'food', label: '餐饮', icon: 'restaurant-outline', color: '#EA580C', iconBackground: '#FFEDD5' },
  { id: 'transport', label: '交通', icon: 'car-outline', color: '#0284C7', iconBackground: '#E0F2FE' },
  { id: 'shopping', label: '购物', icon: 'bag-handle-outline', color: '#7C3AED', iconBackground: '#EDE9FE' },
  { id: 'game', label: '游戏', icon: 'game-controller-outline', color: '#0891B2', iconBackground: '#CFFAFE' },
  { id: 'medical', label: '医疗', icon: 'medkit-outline', color: '#DC2626', iconBackground: '#FEE2E2' },
  { id: 'education', label: '教育', icon: 'school-outline', color: '#2563EB', iconBackground: '#DBEAFE' },
  { id: 'entertainment', label: '娱乐', icon: 'film-outline', color: '#D97706', iconBackground: '#FEF3C7' },
  { id: 'transfer', label: '转账', icon: 'swap-horizontal-outline', color: '#0F766E', iconBackground: '#CCFBF1' },
  { id: 'other', label: '其他', icon: 'grid-outline', color: '#475569', iconBackground: '#E2E8F0' },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map(category => [category.id, category])
) as Record<CategoryId, Category>;

export const CATEGORY_KEYWORDS: { keywords: string[]; category: CategoryId }[] = [
  { keywords: ['美团', '饿了么', '肯德基', 'KFC', '麦当劳', '星巴克', '瑞幸', '餐', '饭', '外卖', '奶茶', '咖啡'], category: 'food' },
  { keywords: ['滴滴', '高德', '地铁', '公交', '铁路', '火车', '飞机', '机票', '出行', '打车', '顺风车'], category: 'transport' },
  { keywords: ['淘宝', '天猫', '京东', '拼多多', '抖音', '快手', '购物', '超市', '沃尔玛', '大润发'], category: 'shopping' },
  { keywords: ['steam', 'Steam', '游戏', '网易', '腾讯游戏', '王者', '原神', '充值', '点券'], category: 'game' },
  { keywords: ['医院', '药店', '诊所', '挂号', '医疗', '药'], category: 'medical' },
  { keywords: ['培训', '课程', '学习', '教育', '网课', '作业帮', '辅导'], category: 'education' },
  { keywords: ['电影', '爱奇艺', '优酷', '腾讯视频', '哔哩哔哩', 'B站', 'KTV', '演出', '票'], category: 'entertainment' },
  { keywords: ['转账', '红包', '收款', '付款给'], category: 'transfer' },
];
