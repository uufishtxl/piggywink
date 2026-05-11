import { describe, it, expect } from 'vitest'
import { 
  calculateCategoryProgress, 
  calculateBudgetSummary 
} from '@/services/budgetCalc'
import type { Budget } from '@/types/budget'
import type { Expense } from '@/types/expense'

describe('calculateCategoryProgress', () => {
  it('计算单个分类的预算进度', () => {
    const budget: Budget = {
      id: 'b1',
      categoryId: 'cat1',
      amount: 1000,
      month: '2026-05',
      repeatType: 'none',
      createdAt: new Date(),
    }
    
    const expenses: Expense[] = [
      { id: 'e1', categoryId: 'cat1', amount: 300, description: '午餐', date: new Date(), createdAt: new Date() },
      { id: 'e2', categoryId: 'cat1', amount: 200, description: '晚餐', date: new Date(), createdAt: new Date() },
      { id: 'e3', categoryId: 'cat2', amount: 100, description: '其他', date: new Date(), createdAt: new Date() },
    ]
    
    const result = calculateCategoryProgress(budget, expenses)
    
    expect(result.budgetAmount).toBe(1000)
    expect(result.spentAmount).toBe(500)
    expect(result.remainingAmount).toBe(500)
    expect(result.percentage).toBe(50)
    expect(result.status).toBe('safe')
  })
  
  it('进度超过60%时状态为warning', () => {
    const budget: Budget = {
      id: 'b1',
      categoryId: 'cat1',
      amount: 100,
      month: '2026-05',
      repeatType: 'none',
      createdAt: new Date(),
    }
    
    const expenses: Expense[] = [
      { id: 'e1', categoryId: 'cat1', amount: 70, description: '测试', date: new Date(), createdAt: new Date() },
    ]
    
    const result = calculateCategoryProgress(budget, expenses)
    
    expect(result.percentage).toBe(70)
    expect(result.status).toBe('warning')
  })
  
  it('进度超过90%时状态为danger', () => {
    const budget: Budget = {
      id: 'b1',
      categoryId: 'cat1',
      amount: 100,
      month: '2026-05',
      repeatType: 'none',
      createdAt: new Date(),
    }
    
    const expenses: Expense[] = [
      { id: 'e1', categoryId: 'cat1', amount: 95, description: '测试', date: new Date(), createdAt: new Date() },
    ]
    
    const result = calculateCategoryProgress(budget, expenses)
    
    expect(result.percentage).toBe(95)
    expect(result.status).toBe('danger')
  })
})

describe('calculateBudgetSummary', () => {
  it('计算全局预算汇总', () => {
    const budgets: Budget[] = [
      { id: 'b1', categoryId: 'cat1', amount: 1000, month: '2026-05', repeatType: 'none', createdAt: new Date() },
      { id: 'b2', categoryId: 'cat2', amount: 500, month: '2026-05', repeatType: 'none', createdAt: new Date() },
    ]
    
    const expenses: Expense[] = [
      { id: 'e1', categoryId: 'cat1', amount: 300, description: '测试', date: new Date(), createdAt: new Date() },
      { id: 'e2', categoryId: 'cat2', amount: 100, description: '测试', date: new Date(), createdAt: new Date() },
    ]
    
    const result = calculateBudgetSummary(budgets, expenses)
    
    expect(result.totalBudget).toBe(1500)
    expect(result.totalSpent).toBe(400)
    expect(result.totalRemaining).toBe(1100)
    expect(result.percentage).toBe(27)
    expect(result.dailyAvailable).toBeGreaterThan(0)
    expect(result.status).toBe('safe')
  })
})