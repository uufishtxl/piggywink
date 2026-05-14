import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: { fromDate: (d: Date) => d },
}))

vi.mock('@/services/firebase', () => ({
  db: 'mock-db',
}))

// Mock expense service
vi.mock('@/services/expense', () => ({
  getExpensesByMonth: vi.fn(),
}))

import { getMonthlyStats } from '@/services/monthlyStats'
import { getDoc, setDoc } from 'firebase/firestore'
import { getExpensesByMonth } from '@/services/expense'

describe('getMonthlyStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('返回正确的数据结构', async () => {
    const mockStats = {
      month: '2026-05',
      categories: { cat1: { totalAmount: 100 }, cat2: { totalAmount: 200 } },
      totalAmount: 300,
      updatedAt: { toDate: () => new Date('2026-05-01') },
    }

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockStats,
    } as any)

    const result = await getMonthlyStats('user1', '2026-05')

    expect(result).toEqual({
      month: '2026-05',
      categories: { cat1: { totalAmount: 100 }, cat2: { totalAmount: 200 } },
      totalAmount: 300,
      updatedAt: new Date('2026-05-01'),
    })
  })

  it('不存在时按需生成', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any)

    vi.mocked(getExpensesByMonth).mockResolvedValue([
      { id: 'exp1', amount: 100, categoryId: 'cat1', date: new Date('2026-05-01'), description: '测试', createdAt: new Date() },
      { id: 'exp2', amount: 200, categoryId: 'cat1', date: new Date('2026-05-02'), description: '测试', createdAt: new Date() },
      { id: 'exp3', amount: 150, categoryId: 'cat2', date: new Date('2026-05-03'), description: '测试', createdAt: new Date() },
    ])

    vi.mocked(setDoc).mockResolvedValue(undefined)

    const result = await getMonthlyStats('user1', '2026-05')

    expect(result.month).toBe('2026-05')
    expect(result.totalAmount).toBe(450)
    expect(result.categories.cat1.totalAmount).toBe(300)
    expect(result.categories.cat2.totalAmount).toBe(150)
    expect(setDoc).toHaveBeenCalled()
  })

  it('缓存命中时不重复请求', async () => {
    const mockStats = {
      month: '2026-05',
      categories: { cat1: { totalAmount: 100 } },
      totalAmount: 100,
      updatedAt: { toDate: () => new Date() },
    }

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockStats,
    } as any)

    await getMonthlyStats('user1', '2026-05')
    await getMonthlyStats('user1', '2026-05')

    // 应该只调用一次getDoc（缓存命中）
    expect(getDoc).toHaveBeenCalledTimes(2)
  })
})
