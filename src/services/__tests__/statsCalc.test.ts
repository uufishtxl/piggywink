import { describe, it, expect } from 'vitest'
import { aggregateByCategory, type ExpenseWithCategory } from '@/services/statsCalc'

describe('statsCalc - 分类聚合深度模块', () => {
  // 模拟数据
  const mockExpenses: ExpenseWithCategory[] = [
    { id: 'exp1', amount: 100, categoryId: 'cat1', categoryName: '餐饮', categoryIcon: '🍜' },
    { id: 'exp2', amount: 50, categoryId: 'cat1', categoryName: '餐饮', categoryIcon: '🍜' },
    { id: 'exp3', amount: 200, categoryId: 'cat2', categoryName: '购物', categoryIcon: '🛒' },
    { id: 'exp4', amount: 50, categoryId: 'cat3', categoryName: '交通', categoryIcon: '🚇' },
  ]

  it('正确聚合同一类别的支出', () => {
    const result = aggregateByCategory(mockExpenses)
    
    // 找到餐饮类别
    const dining = result.find(r => r.categoryId === 'cat1')
    expect(dining).toBeDefined()
    expect(dining!.totalAmount).toBe(150) // 100 + 50
  })

  it('正确计算各类别占比百分比', () => {
    const result = aggregateByCategory(mockExpenses)
    
    // 总计：100 + 50 + 200 + 50 = 400
    const dining = result.find(r => r.categoryId === 'cat1')
    const shopping = result.find(r => r.categoryId === 'cat2')
    const transport = result.find(r => r.categoryId === 'cat3')
    
    expect(dining!.percentage).toBeCloseTo(37.5)  // 150/400 = 37.5%
    expect(shopping!.percentage).toBeCloseTo(50)    // 200/400 = 50%
    expect(transport!.percentage).toBeCloseTo(12.5) // 50/400 = 12.5%
  })

  it('按金额从高到低排序', () => {
    const result = aggregateByCategory(mockExpenses)
    
    expect(result[0].categoryId).toBe('cat2') // 购物 200
    expect(result[1].categoryId).toBe('cat1') // 餐饮 150
    expect(result[2].categoryId).toBe('cat3') // 交通 50
  })

  it('返回正确的聚合数据结构', () => {
    const result = aggregateByCategory(mockExpenses)
    
    // 检查返回的数据结构
    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('categoryId')
    expect(result[0]).toHaveProperty('categoryName')
    expect(result[0]).toHaveProperty('categoryIcon')
    expect(result[0]).toHaveProperty('totalAmount')
    expect(result[0]).toHaveProperty('percentage')
  })

  it('处理空支出列表', () => {
    const result = aggregateByCategory([])
    expect(result).toEqual([])
  })
})
