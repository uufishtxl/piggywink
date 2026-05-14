// 月度预聚合数据服务
// 存储：users/{userId}/monthlyStats/{YYYY-MM}
// 数据结构：{ month: string, categories: { [categoryId]: { totalAmount: number } }, totalAmount: number }

import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

export interface MonthlyStats {
  month: string  // YYYY-MM
  categories: Record<string, { totalAmount: number }>
  totalAmount: number
  updatedAt: Date
}

/**
 * 获取月度预聚合数据
 * 如果不存在，按需生成（查询该月所有支出并聚合）
 * @param userId 用户ID
 * @param month 月份 YYYY-MM
 * @returns 月度统计数据
 */
export async function getMonthlyStats(userId: string, month: string): Promise<MonthlyStats> {
  const statsRef = doc(db, 'users', userId, 'monthlyStats', month)
  const snapshot = await getDoc(statsRef)

  if (snapshot.exists()) {
    const data = snapshot.data()
    return {
      month: data.month,
      categories: data.categories,
      totalAmount: data.totalAmount,
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    }
  }

  // 不存在，按需生成
  return await generateMonthlyStats(userId, month)
}

/**
 * 生成月度预聚合数据
 * @param userId 用户ID
 * @param month 月份 YYYY-MM
 * @returns 生成的统计数据
 */
async function generateMonthlyStats(userId: string, month: string): Promise<MonthlyStats> {
  // 查询该月所有支出
  const { getExpensesByMonth } = await import('@/services/expense')
  const expenses = await getExpensesByMonth(userId, month)

  // 按分类聚合
  const categories: Record<string, { totalAmount: number }> = {}
  let totalAmount = 0

  for (const expense of expenses) {
    const categoryId = expense.categoryId
    if (!categories[categoryId]) {
      categories[categoryId] = { totalAmount: 0 }
    }
    categories[categoryId].totalAmount += expense.amount
    totalAmount += expense.amount
  }

  const stats: MonthlyStats = {
    month,
    categories,
    totalAmount,
    updatedAt: new Date(),
  }

  // 保存到Firestore
  await saveMonthlyStats(userId, stats)

  return stats
}

/**
 * 保存月度预聚合数据
 * @param userId 用户ID
 * @param stats 统计数据
 */
export async function saveMonthlyStats(userId: string, stats: MonthlyStats): Promise<void> {
  const statsRef = doc(db, 'users', userId, 'monthlyStats', stats.month)
  await setDoc(statsRef, {
    month: stats.month,
    categories: stats.categories,
    totalAmount: stats.totalAmount,
    updatedAt: Timestamp.fromDate(stats.updatedAt),
  })
}

/**
 * 更新月度预聚合数据
 * @param userId 用户ID
 * @param month 月份 YYYY-MM
 */
export async function updateMonthlyStats(userId: string, month: string): Promise<void> {
  const stats = await generateMonthlyStats(userId, month)
  // 已在generateMonthlyStats中保存
}
