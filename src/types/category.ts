// 分类类型
export interface Category {
  id: string
  name: string
  icon: string  // emoji
  isSafe: boolean  // true = 常规类别（始终计入统计），false = 非常规类别（可手动排除）
  isSystem: boolean  // 系统预设，不可删除
  createdAt: Date
}

// 系统预设 20 个支出分类（按 Issue #4 定义）
export const PRESET_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: '餐饮', icon: '🍜', isSafe: true, isSystem: true },
  { name: '购物', icon: '🛒', isSafe: false, isSystem: true },
  { name: '日用品', icon: '🧴', isSafe: true, isSystem: true },
  { name: '交通', icon: '🚇', isSafe: true, isSystem: true },
  { name: '水果', icon: '🍎', isSafe: true, isSystem: true },
  { name: '零食', icon: '🍬', isSafe: true, isSystem: true },
  { name: '娱乐', icon: '🎮', isSafe: false, isSystem: true },
  { name: '通讯', icon: '📱', isSafe: false, isSystem: true },
  { name: '家庭', icon: '🏠', isSafe: false, isSystem: true },
  { name: '社交', icon: '🤝', isSafe: false, isSystem: true },
  { name: '旅行', icon: '✈️', isSafe: false, isSystem: true },
  { name: '医疗', icon: '💊', isSafe: false, isSystem: true },
  { name: '书籍', icon: '📚', isSafe: true, isSystem: true },
  { name: '学习及兴趣', icon: '🎨', isSafe: false, isSystem: true },
  { name: '礼金', icon: '🎁', isSafe: false, isSystem: true },
  { name: '其他', icon: '📦', isSafe: true, isSystem: true },
  { name: '水电煤', icon: '💡', isSafe: false, isSystem: true },
  { name: '牛奶', icon: '🥛', isSafe: true, isSystem: true },
  { name: '食材', icon: '🥬', isSafe: true, isSystem: true },
  { name: '天天', icon: '🎒', isSafe: false, isSystem: true },
]