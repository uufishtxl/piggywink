import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'budget123' }),
  collection: vi.fn(),
  doc: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp' },
  getFirestore: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      { id: 'b1', data: () => ({ categoryId: 'cat1', amount: 1000, month: '2026-05', repeatType: 'none', createdAt: { toDate: () => new Date() } }) },
      { id: 'b2', data: () => ({ categoryId: 'cat2', amount: 500, month: '2026-05', repeatType: 'monthly', createdAt: { toDate: () => new Date() } }) },
    ]
  }),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
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

import { saveBudget, getBudgetsByMonth, deleteBudget, updateBudget } from '@/services/budget'
import { addDoc, deleteDoc, updateDoc } from 'firebase/firestore'

describe('saveBudget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('保存预算到 Firestore 并返回文档ID', async () => {
    const result = await saveBudget({
      userId: 'user1',
      data: {
        categoryId: 'cat1',
        amount: 1000,
        month: '2026-05',
        repeatType: 'none',
      }
    })
    
    expect(result).toBe('budget123')
    expect(addDoc).toHaveBeenCalled()
  })
})

describe('getBudgetsByMonth', () => {
  it('按月查询预算列表', async () => {
    const budgets = await getBudgetsByMonth('user1', '2026-05')
    
    expect(budgets).toHaveLength(2)
    expect(budgets[0].categoryId).toBe('cat1')
    expect(budgets[0].amount).toBe(1000)
    expect(budgets[1].repeatType).toBe('monthly')
  })
})

describe('deleteBudget', () => {
  it('删除指定预算', async () => {
    await deleteBudget('user1', 'budget123')
    
    expect(deleteDoc).toHaveBeenCalled()
  })
})

describe('updateBudget', () => {
  it('更新预算金额', async () => {
    await updateBudget('user1', 'budget123', { amount: 2000 })
    
    expect(updateDoc).toHaveBeenCalled()
  })
})