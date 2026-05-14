import { describe, it, expect } from 'vitest'
import { 
  filterExpenses, 
  type FilterInput, 
  type ExpenseForFilter,
  type CategoryForFilter 
} from '@/services/statsFilter'

describe('statsFilter - 高级筛选深度模块', () => {
  // 模拟分类数据
  const mockCategories: CategoryForFilter[] = [
    { id: 'cat1', name: '餐饮', isSafe: true },
    { id: 'cat2', name: '购物', isSafe: false },
    { id: 'cat3', name: '交通', isSafe: true },
    { id: 'cat4', name: '娱乐', isSafe: false },
  ]

  // 模拟支出数据
  const mockExpenses: ExpenseForFilter[] = [
    { id: 'exp1', amount: 100, categoryId: 'cat1' },  // 餐饮 - 常规类别
    { id: 'exp2', amount: 200, categoryId: 'cat2' },  // 购物 - 非常规类别
    { id: 'exp3', amount: 50, categoryId: 'cat3' },   // 交通 - 常规类别
    { id: 'exp4', amount: 150, categoryId: 'cat4' },  // 娱乐 - 非常规类别
  ]

  it('不排除任何类别时保留所有支出', () => {
    const input: FilterInput = {
      expenses: mockExpenses,
      categories: mockCategories,
      excludeCategoryIds: [],
      excludeSafeCategories: false,
    }

    const result = filterExpenses(input)

    // 保留所有 4 个类别
    expect(result.filteredExpenses).toHaveLength(4)
    expect(result.totalAmount).toBe(500) // 100+200+50+150
  })

  it('排除所有常规类别（isSafe=true）', () => {
    const input: FilterInput = {
      expenses: mockExpenses,
      categories: mockCategories,
      excludeCategoryIds: [],
      excludeSafeCategories: true,
    }

    const result = filterExpenses(input)

    // 只保留 cat2 (购物) 和 cat4 (娱乐)
    expect(result.filteredExpenses).toHaveLength(2)
    expect(result.filteredExpenses.map(e => e.categoryId)).toEqual(
      expect.arrayContaining(['cat2', 'cat4'])
    )
    expect(result.totalAmount).toBe(350) // 200 + 150
  })

  it('手动排除特定分类', () => {
    const input: FilterInput = {
      expenses: mockExpenses,
      categories: mockCategories,
      excludeCategoryIds: ['cat2'], // 手动排除购物
      excludeSafeCategories: false,
    }

    const result = filterExpenses(input)

    // 保留 cat1, cat3, cat4
    expect(result.filteredExpenses).toHaveLength(3)
    expect(result.filteredExpenses.map(e => e.categoryId)).not.toContain('cat2')
    expect(result.totalAmount).toBe(300) // 100 + 50 + 150
  })

  it('同时应用常规类别排除和手动排除', () => {
    const input: FilterInput = {
      expenses: mockExpenses,
      categories: mockCategories,
      excludeCategoryIds: ['cat4'], // 手动排除娱乐
      excludeSafeCategories: true,  // 排除常规类别
    }

    const result = filterExpenses(input)

    // 只保留 cat2 (购物)，因为 cat1, cat3 是常规类别被排除，cat4 被手动排除
    expect(result.filteredExpenses).toHaveLength(1)
    expect(result.filteredExpenses[0].categoryId).toBe('cat2')
    expect(result.totalAmount).toBe(200)
  })

  it('返回筛选前后的金额对比', () => {
    const input: FilterInput = {
      expenses: mockExpenses,
      categories: mockCategories,
      excludeCategoryIds: [],
      excludeSafeCategories: true,
    }

    const result = filterExpenses(input)

    // 原始总额 500，筛选后 350
    expect(result.originalTotal).toBe(500) // 100+200+50+150
    expect(result.totalAmount).toBe(350)   // 200+150
  })
})
