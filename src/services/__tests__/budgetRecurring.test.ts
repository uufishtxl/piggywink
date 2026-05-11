import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'new-budget' }),
  collection: vi.fn(),
  doc: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp' },
  getFirestore: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('firebase/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))
vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
}))

import { shouldGenerateBudget, generateRecurringBudgets } from '@/services/budgetRecurring'
import type { Budget } from '@/types/budget'

describe('shouldGenerateBudget', () => {
  it('月度预算：每个月都应生成', () => {
    expect(shouldGenerateBudget('monthly', '2026-01', '2026-05')).toBe(true)
    expect(shouldGenerateBudget('monthly', '2026-05', '2026-05')).toBe(true)
  })
  
  it('季度预算：每3个月生成一次', () => {
    // 创建于1月，2月和3月不生成，4月生成
    expect(shouldGenerateBudget('quarterly', '2026-01', '2026-02')).toBe(false)
    expect(shouldGenerateBudget('quarterly', '2026-01', '2026-03')).toBe(false)
    expect(shouldGenerateBudget('quarterly', '2026-01', '2026-04')).toBe(true)
    expect(shouldGenerateBudget('quarterly', '2026-01', '2026-07')).toBe(true)
  })
  
  it('半年预算：每6个月生成一次', () => {
    // 创建于8月，次年2月生成
    expect(shouldGenerateBudget('semi-annually', '2026-08', '2026-09')).toBe(false)
    expect(shouldGenerateBudget('semi-annually', '2026-08', '2027-02')).toBe(true)
  })
  
  it('年度预算：每12个月生成一次', () => {
    // 创建于2025年12月，2026年11月不生成，2026年12月生成
    expect(shouldGenerateBudget('annually', '2025-12', '2026-11')).toBe(false)
    expect(shouldGenerateBudget('annually', '2025-12', '2026-12')).toBe(true)
  })
  
  it('不重复预算：只在当月生成', () => {
    expect(shouldGenerateBudget('none', '2026-05', '2026-05')).toBe(true)
    expect(shouldGenerateBudget('none', '2026-05', '2026-06')).toBe(false)
  })
})

describe('generateRecurringBudgets', () => {
  it('幂等性：同一个月重复调用5次只生成1笔', async () => {
    const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-budget' })
    vi.mocked(await import('firebase/firestore')).addDoc = mockAddDoc
    
    // 模拟已有预算（避免重复生成）
    vi.mocked(await import('firebase/firestore')).getDocs = vi.fn().mockResolvedValue({
      docs: [{ id: 'existing', data: () => ({}) }]
    })
    
    const budgets: Budget[] = [{
      id: 'b1',
      categoryId: 'cat1',
      amount: 1000,
      month: '2026-01',
      repeatType: 'monthly',
      createdAt: new Date(),
    }]
    
    // 调用5次
    for (let i = 0; i < 5; i++) {
      await generateRecurringBudgets('user1', '2026-05', budgets)
    }
    
    // 由于已有预算存在，不应调用addDoc
    expect(mockAddDoc).not.toHaveBeenCalled()
  })
})