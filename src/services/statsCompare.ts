// 对比数据查询服务
// 获取两个月预聚合数据，计算浮动值，排序，过滤

import { getMonthlyStats, type MonthlyStats } from '@/services/monthlyStats'

export interface CompareCategoryData {
  categoryId: string
  categoryName: string
  categoryIcon: string
  currentAmount: number
  previousAmount: number
  changePercent: number  // 浮动百分比
  budget?: number        // 预算金额
}

export interface CompareData {
  currentMonth: string
  previousMonth: string
  categories: CompareCategoryData[]
  totalCurrent: number
  totalPrevious: number
  totalChangePercent: number
}

// 分类信息（从外部传入）
export interface CategoryInfo {
  id: string
  name: string
  icon: string
  isSafe: boolean
}

// 预算信息
export interface BudgetInfo {
  categoryId: string
  amount: number
}

/**
 * 获取对比数据
 * @param userId 用户ID
 * @param month 月份 YYYY-MM
 * @param selectedCategoryIds 选中的分类ID列表（用于过滤）
 * @param categories 分类信息列表
 * @param budgets 预算信息列表
 * @returns 对比数据
 */
export async function getCompareData(
  userId: string,
  month: string,
  selectedCategoryIds: string[],
  categories: CategoryInfo[],
  budgets: BudgetInfo[]
): Promise<CompareData> {
  const previousMonth = getPreviousMonth(month)
  
  // 并行获取两个月的数据
  const [currentStats, previousStats] = await Promise.all([
    getMonthlyStats(userId, month),
    getMonthlyStats(userId, previousMonth),
  ])

  // 构建分类查找表
  const categoryMap = new Map<string, CategoryInfo>()
  for (const cat of categories) {
    categoryMap.set(cat.id, cat)
  }

  // 构建预算查找表
  const budgetMap = new Map<string, number>()
  for (const budget of budgets) {
    budgetMap.set(budget.categoryId, budget.amount)
  }

  // 合并两个月的所有分类ID
  const allCategoryIds = new Set([
    ...Object.keys(currentStats.categories),
    ...Object.keys(previousStats.categories),
  ])

  // 分类列表（用于C/D区域图表和表格）
  // 必须包含：所有常规类别(isSafe=true) + 选中的非常规类别(isSafe=false)
  const safeCategoryIds = categories.filter(c => c.isSafe).map(c => c.id)
  const selectedUnsafeIds = categories
    .filter(c => !c.isSafe && selectedCategoryIds.includes(c.id))
    .map(c => c.id)
  
  // 过滤有实际数据的分类
  const filteredCategoryIds = [...safeCategoryIds, ...selectedUnsafeIds].filter(id => 
    currentStats.categories[id] || previousStats.categories[id]
  )

  // 构建分类对比数据
  const categoriesData: CompareCategoryData[] = filteredCategoryIds.map(categoryId => {
    const currentAmount = currentStats.categories[categoryId]?.totalAmount || 0
    const previousAmount = previousStats.categories[categoryId]?.totalAmount || 0
    const category = categoryMap.get(categoryId)
    const budget = budgetMap.get(categoryId)

    // 计算浮动百分比
    let changePercent = 0
    if (previousAmount > 0) {
      changePercent = ((currentAmount - previousAmount) / previousAmount) * 100
    } else if (currentAmount > 0) {
      // 上月无支出，本月有支出，标记为新增
      changePercent = 100
    }

    return {
      categoryId,
      categoryName: category?.name || '未分类',
      categoryIcon: category?.icon || '📦',
      currentAmount,
      previousAmount,
      changePercent,
      budget,
    }
  })

  // 按本月支出降序排列
  categoriesData.sort((a, b) => b.currentAmount - a.currentAmount)

  // B区域总支出计算：只统计常规类别(isSafe=true) + 选中的非常规类别
  const bAreaCategoryIds = new Set<string>()
  
  // 添加所有 isSafe=true 的分类
  for (const cat of categories) {
    if (cat.isSafe) {
      bAreaCategoryIds.add(cat.id)
    }
  }
  
  // 如果有选中的分类，添加其中 isSafe=false 的分类
  if (selectedCategoryIds.length > 0) {
    for (const catId of selectedCategoryIds) {
      const cat = categoryMap.get(catId)
      if (cat && !cat.isSafe) {
        bAreaCategoryIds.add(catId)
      }
    }
  }

  // 计算B区域的总支出
  let totalCurrent = 0
  let totalPrevious = 0
  
  for (const categoryId of bAreaCategoryIds) {
    totalCurrent += currentStats.categories[categoryId]?.totalAmount || 0
    totalPrevious += previousStats.categories[categoryId]?.totalAmount || 0
  }

  // 计算总支出变化
  let totalChangePercent = 0
  if (totalPrevious > 0) {
    totalChangePercent = ((totalCurrent - totalPrevious) / totalPrevious) * 100
  }

  return {
    currentMonth: month,
    previousMonth,
    categories: categoriesData,
    totalCurrent,
    totalPrevious,
    totalChangePercent,
  }
}

/**
 * 获取TOP3分类数据
 * @param categoriesData 分类对比数据
 * @returns TOP3分类数据
 */
export function getTop3Categories(categoriesData: CompareCategoryData[]): CompareCategoryData[] {
  return categoriesData.slice(0, 3)
}

/**
 * 获取上个月 YYYY-MM
 * @param month 当前月份 YYYY-MM
 * @returns 上个月 YYYY-MM
 */
function getPreviousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 2, 1) // 月份从0开始，所以减2
  const py = date.getFullYear()
  const pm = String(date.getMonth() + 1).padStart(2, '0')
  return `${py}-${pm}`
}

/**
 * 格式化金额
 * @param amount 金额
 * @returns 格式化后的金额字符串，如 ¥800.00
 */
export function formatAmount(amount: number): string {
  return `¥ ${amount.toFixed(2)}`
}

/**
 * 格式化变化百分比
 * @param percent 百分比
 * @returns 格式化后的字符串，如 +25.0% 或 -40.0%
 */
export function formatChangePercent(percent: number): string {
  if (percent > 0) {
    return `+${percent.toFixed(1)}%`
  } else if (percent < 0) {
    return `${percent.toFixed(1)}%`
  }
  return '0%'
}
