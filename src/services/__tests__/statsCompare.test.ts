import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock monthlyStats service
vi.mock('@/services/monthlyStats', () => ({
  getMonthlyStats: vi.fn(),
}))

import { getCompareData, getTop3Categories, formatAmount, formatChangePercent } from '@/services/statsCompare'
import { getMonthlyStats } from '@/services/monthlyStats'

const mockCategories = [
  { id: 'cat1', name: '餐饮', icon: '🍜', isSafe: true },
  { id: 'cat2', name: '购物', icon: '🛒', isSafe: false },
  { id: 'cat3', name: '交通', icon: '🚇', isSafe: true },
]

const mockBudgets = [
  { categoryId: 'cat1', amount: 800 },
  { categoryId: 'cat2', amount: 400 },
]

describe('getCompareData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('返回正确的数据结构', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 100 }, cat2: { totalAmount: 200 } },
          totalAmount: 300,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: { cat1: { totalAmount: 80 }, cat2: { totalAmount: 160 } },
          totalAmount: 240,
          updatedAt: new Date(),
        }
      }
    })

    const result = await getCompareData('user1', '2026-05', [], mockCategories, mockBudgets)

    expect(result.currentMonth).toBe('2026-05')
    expect(result.previousMonth).toBe('2026-04')
    expect(result.totalCurrent).toBe(300)
    expect(result.totalPrevious).toBe(240)
    expect(result.categories).toHaveLength(2)
  })

  it('浮动值计算正确（增长）', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 100 } },
          totalAmount: 100,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: { cat1: { totalAmount: 80 } },
          totalAmount: 80,
          updatedAt: new Date(),
        }
      }
    })

    const result = await getCompareData('user1', '2026-05', [], mockCategories, [])

    // 增长25%: (100-80)/80 = 0.25
    expect(result.categories[0].changePercent).toBe(25)
    expect(result.totalChangePercent).toBe(25)
  })

  it('浮动值计算正确（下降）', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 60 } },
          totalAmount: 60,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: { cat1: { totalAmount: 100 } },
          totalAmount: 100,
          updatedAt: new Date(),
        }
      }
    })

    const result = await getCompareData('user1', '2026-05', [], mockCategories, [])

    // 下降40%: (60-100)/100 = -0.4
    expect(result.categories[0].changePercent).toBe(-40)
    expect(result.totalChangePercent).toBe(-40)
  })

  it('上月无支出时显示新增', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 100 } },
          totalAmount: 100,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: {},
          totalAmount: 0,
          updatedAt: new Date(),
        }
      }
    })

    const result = await getCompareData('user1', '2026-05', [], mockCategories, [])

    // 上月无支出，本月有支出，changePercent应为100
    expect(result.categories[0].changePercent).toBe(100)
  })

  it('排序逻辑正确（按本月支出降序）', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 100 }, cat2: { totalAmount: 300 }, cat3: { totalAmount: 200 } },
          totalAmount: 600,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: { cat1: { totalAmount: 80 }, cat2: { totalAmount: 240 }, cat3: { totalAmount: 160 } },
          totalAmount: 480,
          updatedAt: new Date(),
        }
      }
    })

    const result = await getCompareData('user1', '2026-05', [], mockCategories, [])

    // 应该按本月支出降序：cat2(300) > cat3(200) > cat1(100)
    expect(result.categories[0].categoryId).toBe('cat2')
    expect(result.categories[1].categoryId).toBe('cat3')
    expect(result.categories[2].categoryId).toBe('cat1')
  })

  it('类别过滤逻辑正确', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 100 }, cat2: { totalAmount: 200 }, cat3: { totalAmount: 300 } },
          totalAmount: 600,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: { cat1: { totalAmount: 80 }, cat2: { totalAmount: 160 }, cat3: { totalAmount: 240 } },
          totalAmount: 480,
          updatedAt: new Date(),
        }
      }
    })

    // 只选择cat1和cat2
    const result = await getCompareData('user1', '2026-05', ['cat1', 'cat2'], mockCategories, [])

    // 应该只有2个分类
    expect(result.categories).toHaveLength(2)
    expect(result.categories.find(c => c.categoryId === 'cat1')).toBeDefined()
    expect(result.categories.find(c => c.categoryId === 'cat2')).toBeDefined()
    expect(result.categories.find(c => c.categoryId === 'cat3')).toBeUndefined()
  })

  it('预算数据正确获取和显示', async () => {
    vi.mocked(getMonthlyStats).mockImplementation(async (userId, month) => {
      if (month === '2026-05') {
        return {
          month: '2026-05',
          categories: { cat1: { totalAmount: 100 }, cat2: { totalAmount: 200 } },
          totalAmount: 300,
          updatedAt: new Date(),
        }
      } else {
        return {
          month: '2026-04',
          categories: { cat1: { totalAmount: 80 }, cat2: { totalAmount: 160 } },
          totalAmount: 240,
          updatedAt: new Date(),
        }
      }
    })

    const result = await getCompareData('user1', '2026-05', [], mockCategories, mockBudgets)

    // cat1有预算800，cat2有预算400
    const cat1 = result.categories.find(c => c.categoryId === 'cat1')
    const cat2 = result.categories.find(c => c.categoryId === 'cat2')
    expect(cat1?.budget).toBe(800)
    expect(cat2?.budget).toBe(400)
  })
})

describe('getTop3Categories', () => {
  it('返回前3个分类', () => {
    // 输入假设已经按currentAmount降序排序
    const categories = [
      { categoryId: 'cat2', categoryName: '购物', categoryIcon: '🛒', currentAmount: 300, previousAmount: 240, changePercent: 25 },
      { categoryId: 'cat3', categoryName: '交通', categoryIcon: '🚇', currentAmount: 200, previousAmount: 160, changePercent: 25 },
      { categoryId: 'cat1', categoryName: '餐饮', categoryIcon: '🍜', currentAmount: 100, previousAmount: 80, changePercent: 25 },
      { categoryId: 'cat4', categoryName: '娱乐', categoryIcon: '🎮', currentAmount: 150, previousAmount: 120, changePercent: 25 },
    ]

    const result = getTop3Categories(categories)

    expect(result).toHaveLength(3)
    expect(result[0].categoryId).toBe('cat2')
    expect(result[1].categoryId).toBe('cat3')
    expect(result[2].categoryId).toBe('cat1')
  })
})

describe('formatAmount', () => {
  it('格式化金额', () => {
    expect(formatAmount(800)).toBe('¥ 800.00')
    expect(formatAmount(1234.56)).toBe('¥ 1234.56')
    expect(formatAmount(0)).toBe('¥ 0.00')
  })
})

describe('formatChangePercent', () => {
  it('格式化变化百分比', () => {
    expect(formatChangePercent(25)).toBe('+25.0%')
    expect(formatChangePercent(-40)).toBe('-40.0%')
    expect(formatChangePercent(0)).toBe('0%')
  })
})
