// 高级筛选深度模块
// 处理常规类别（isSafe）排除逻辑及用户手动排除逻辑

export interface CategoryForFilter {
  id: string
  name: string
  isSafe: boolean
}

export interface ExpenseForFilter {
  id: string
  amount: number
  categoryId: string
}

export interface FilterInput {
  expenses: ExpenseForFilter[]
  categories: CategoryForFilter[]
  excludeCategoryIds: string[]  // 手动排除的分类ID列表
  excludeSafeCategories: boolean // 是否排除常规类别（isSafe=true）
}

export interface FilterResult {
  filteredExpenses: ExpenseForFilter[]
  originalTotal: number
  totalAmount: number
}

/**
 * 筛选支出数据
 * @param input 筛选输入
 * @returns 筛选结果
 */
export function filterExpenses(input: FilterInput): FilterResult {
  const { expenses, categories, excludeCategoryIds, excludeSafeCategories } = input

  // 计算原始总额
  const originalTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // 构建分类查找表
  const categoryMap = new Map<string, CategoryForFilter>()
  for (const cat of categories) {
    categoryMap.set(cat.id, cat)
  }

  // 筛选支出
  const filteredExpenses = expenses.filter(expense => {
    const category = categoryMap.get(expense.categoryId)
    if (!category) return true // 未知分类默认保留

    // 检查是否被手动排除
    if (excludeCategoryIds.includes(expense.categoryId)) {
      return false
    }

    // 检查是否需要排除常规类别
    // excludeSafeCategories: true → 排除常规类别（只保留非常规类别）
    // excludeSafeCategories: false → 不排除常规类别（保留所有）
    if (excludeSafeCategories && category.isSafe) {
      return false
    }

    return true
  })

  // 计算筛选后总额
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  return {
    filteredExpenses,
    originalTotal,
    totalAmount,
  }
}
