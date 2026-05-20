import { describe, it, expect, vi } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => {
  const mockSetDoc = vi.fn().mockResolvedValue(undefined)
  const mockAddDoc = vi.fn().mockResolvedValue({ id: 'snapshot123' })
  const mockGetDoc = vi.fn().mockResolvedValue({
    exists: () => true,
    id: '2026-04',
    data: () => ({
      month: '2026-04',
      totalAssets: 3000,
      totalLiabilities: 0,
      netAssets: 3000,
      accountBreakdown: [
        { type: 'ewallet', total: 3000, count: 1 }
      ],
      createdAt: { toDate: () => new Date() }
    })
  })

  return {
    setDoc: mockSetDoc,
    addDoc: mockAddDoc,
    doc: vi.fn().mockReturnValue('docRef'),
    collection: vi.fn().mockReturnValue('collectionRef'),
    Timestamp: { now: () => 'mock-timestamp' },
    getFirestore: vi.fn(),
    getDoc: mockGetDoc,
    getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  }
})

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

import { seedFakeSnapshot } from '@/services/mockSnapshot'
import { addDoc } from 'firebase/firestore'

describe('seedFakeSnapshot', () => {
  it('生成3月、4月和5月的假快照数据', async () => {
    await seedFakeSnapshot('user1')

    // 验证调用了三次 addDoc
    expect(addDoc).toHaveBeenCalledTimes(3)
  })
})