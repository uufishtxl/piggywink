// 分类聚合深度模块
// 输入：带有分类信息的支出列表
// 输出：按类别聚合后的数据（含百分比）

export interface ExpenseWithCategory {
  id: string
  amount: number
  categoryId: string
  categoryName: string
  categoryIcon: string
}

export interface CategoryAggregation {
  categoryId: string
  categoryName: string
  categoryIcon: string
  totalAmount: number
  percentage: number
}

/**
 * 按类别聚合支出并计算百分比
 * @param expenses 带有分类信息的支出列表
 * @returns 按金额从高到低排序的类别聚合数据
 */
export function aggregateByCategory(expenses: ExpenseWithCategory[]): CategoryAggregation[] {
  if (expenses.length === 0) return []

  // 按 categoryId 分组求和
  const categoryMap = new Map<string, {
    categoryName: string
    categoryIcon: string
    totalAmount: number
  }>()

  for (const expense of expenses) {
    const existing = categoryMap.get(expense.categoryId)
    if (existing) {
      existing.totalAmount += expense.amount
    } else {
      categoryMap.set(expense.categoryId, {
        categoryName: expense.categoryName,
        categoryIcon: expense.categoryIcon,
        totalAmount: expense.amount,
      })
    }
  }

  // 计算总金额
  const totalAmount = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.totalAmount,
    0
  )

  // 转换为数组并计算百分比
  const result: CategoryAggregation[] = Array.from(categoryMap.entries()).map(
    ([categoryId, data]) => ({
      categoryId,
      categoryName: data.categoryName,
      categoryIcon: data.categoryIcon,
      totalAmount: data.totalAmount,
      percentage: totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0,
    })
  )

  // 按金额从高到低排序
  result.sort((a, b) => b.totalAmount - a.totalAmount)

  return result
}
