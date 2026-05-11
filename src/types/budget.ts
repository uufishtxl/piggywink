// 重复周期类型
export type RepeatType = 'none' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually'

// 预算数据结构
export interface Budget {
  id: string
  categoryId: string
  amount: number
  month: string  // YYYY-MM 格式
  repeatType: RepeatType
  createdAt: Date
}

// 新增预算时的数据
export interface BudgetData {
  categoryId: string
  amount: number
  month: string
  repeatType: RepeatType
}