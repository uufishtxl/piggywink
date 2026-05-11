import { describe, it, expect, vi } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'snapshot123' }),
  collection: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp' },
  getFirestore: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'snapshot1',
        data: () => ({
          month: '2026-04',
          totalAssets: 50000,
          totalLiabilities: 10000,
          netAssets: 40000,
          accountBreakdown: [
            { type: 'savings', total: 50000, count: 1 },
            { type: 'credit', total: 10000, count: 1 }
          ],
          createdAt: { toDate: () => new Date() }
        })
      }
    ]
  }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
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

import { createAssetSnapshot, getAssetSnapshot, getLatestAssetSnapshot, getPreviousMonthSnapshot } from '@/services/assetSnapshot'
import { addDoc } from 'firebase/firestore'

const mockAccounts = [
  {
    id: 'acc1',
    name: '招商银行储蓄卡',
    type: 'savings' as const,
    balance: 50000,
    createdAt: new Date()
  },
  {
    id: 'acc2',
    name: '信用卡',
    type: 'credit' as const,
    balance: 10000,
    createdAt: new Date()
  }
]

describe('createAssetSnapshot', () => {
  it('创建资产快照并返回ID', async () => {
    const id = await createAssetSnapshot({
      userId: 'user1',
      month: '2026-05',
      accounts: mockAccounts
    })
    
    expect(id).toBe('snapshot123')
    expect(addDoc).toHaveBeenCalledTimes(1)
  })
})

describe('getAssetSnapshot', () => {
  it('获取指定月份的快照', async () => {
    const snapshot = await getAssetSnapshot({
      userId: 'user1',
      month: '2026-04'
    })
    
    expect(snapshot).not.toBeNull()
    expect(snapshot!.month).toBe('2026-04')
    expect(snapshot!.netAssets).toBe(40000)
  })
})

describe('getLatestAssetSnapshot', () => {
  it('获取最新快照', async () => {
    const snapshot = await getLatestAssetSnapshot({
      userId: 'user1'
    })
    
    expect(snapshot).not.toBeNull()
    expect(snapshot!.month).toBe('2026-04')
  })
})

describe('getPreviousMonthSnapshot', () => {
  it('获取上月快照', async () => {
    const snapshot = await getPreviousMonthSnapshot({
      userId: 'user1',
      currentMonth: '2026-05'
    })
    
    expect(snapshot).not.toBeNull()
    expect(snapshot!.month).toBe('2026-04')
  })
})