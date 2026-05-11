import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Budget, RepeatType } from '@/types/budget'

// 解析月份字符串为年月数字
function parseMonth(month: string): { year: number; month: number } {
  const [y, m] = month.split('-').map(Number)
  return { year: y, month: m }
}

// 计算两个月份之间的月数差
function monthsBetween(from: string, to: string): number {
  const fromDate = parseMonth(from)
  const toDate = parseMonth(to)
  return (toDate.year - fromDate.year) * 12 + (toDate.month - fromDate.month)
}

// 判断是否应该生成预算
export function shouldGenerateBudget(
  repeatType: RepeatType,
  createdMonth: string,
  targetMonth: string
): boolean {
  if (repeatType === 'none') {
    return createdMonth === targetMonth
  }
  
  const diff = monthsBetween(createdMonth, targetMonth)
  
  if (diff < 0) return false  // 目标月份在创建月份之前
  
  switch (repeatType) {
    case 'monthly':
      return true  // 每个月都生成
    case 'quarterly':
      return diff % 3 === 0  // 每3个月
    case 'semi-annually':
      return diff % 6 === 0  // 每6个月
    case 'annually':
      return diff % 12 === 0  // 每12个月
    default:
      return false
  }
}

// 生成周期性预算（幂等）
export async function generateRecurringBudgets(
  userId: string,
  currentMonth: string,
  existingBudgets: Budget[]
): Promise<void> {
  const budgetsRef = collection(db, 'users', userId, 'budgets')
  
  // 找出所有需要延续的预算（非 none 类型）
  const recurringBudgets = existingBudgets.filter(b => b.repeatType !== 'none')
  
  for (const budget of recurringBudgets) {
    // 检查是否应该在当前月份生成
    if (!shouldGenerateBudget(budget.repeatType, budget.month, currentMonth)) {
      continue
    }
    
    // 检查是否已经存在（幂等性）
    const existingQuery = query(
      budgetsRef,
      where('categoryId', '==', budget.categoryId),
      where('month', '==', currentMonth)
    )
    const snapshot = await getDocs(existingQuery)
    
    if (!snapshot.empty) {
      continue  // 已存在，跳过
    }
    
    // 生成新预算
    await addDoc(budgetsRef, {
      categoryId: budget.categoryId,
      amount: budget.amount,
      month: currentMonth,
      repeatType: budget.repeatType,
      createdAt: Timestamp.now(),
    })
  }
}