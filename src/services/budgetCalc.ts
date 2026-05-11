import type { Budget } from '@/types/budget'
import type { Expense } from '@/types/expense'

// 预算进度信息
export interface BudgetProgress {
  categoryId: string
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  percentage: number  // 0-100
  status: 'safe' | 'warning' | 'danger'  // <60%, 60-90%, >90%
}

// 全局预算汇总
export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  percentage: number
  dailyAvailable: number
  status: 'safe' | 'warning' | 'danger'
}

// 计算单个分类的预算进度
export function calculateCategoryProgress(
  budget: Budget,
  expenses: Expense[]
): BudgetProgress {
  const spent = expenses
    .filter(e => e.categoryId === budget.categoryId)
    .reduce((sum, e) => sum + e.amount, 0)
  
  const remaining = budget.amount - spent
  const percentage = budget.amount > 0 
    ? Math.min(Math.round((spent / budget.amount) * 100), 100)
    : 0
  
  let status: 'safe' | 'warning' | 'danger' = 'safe'
  if (percentage >= 90) status = 'danger'
  else if (percentage >= 60) status = 'warning'
  
  return {
    categoryId: budget.categoryId,
    budgetAmount: budget.amount,
    spentAmount: spent,
    remainingAmount: remaining,
    percentage,
    status,
  }
}

// 计算全局预算汇总
export function calculateBudgetSummary(
  budgets: Budget[],
  expenses: Expense[]
): BudgetSummary {
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalRemaining = totalBudget - totalSpent
  
  const percentage = totalBudget > 0
    ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100)
    : 0
  
  // 计算日均可消费（按当月剩余天数）
  const now = new Date()
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
  const dailyAvailable = daysLeft > 0 ? Math.round(totalRemaining / daysLeft) : 0
  
  let status: 'safe' | 'warning' | 'danger' = 'safe'
  if (percentage >= 90) status = 'danger'
  else if (percentage >= 60) status = 'warning'
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    percentage,
    dailyAvailable,
    status,
  }
}