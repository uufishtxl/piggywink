import { describe, it, expect, vi } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'acc123' }),
  collection: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp', fromDate: (d: Date) => d },
  getFirestore: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'acc1',
        data: () => ({
          name: '招商银行储蓄卡',
          type: 'savings',
          balance: 50000,
          createdAt: { toDate: () => new Date() }
        })
      }
    ]
  }),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
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

import { createAssetAccount, getAssetAccounts, updateAssetAccount, deleteAssetAccount } from '@/services/asset'
import { addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

describe('createAssetAccount', () => {
  it('创建资产账户并返回ID', async () => {
    const id = await createAssetAccount({
      userId: 'user1',
      data: {
        name: '招商银行储蓄卡',
        type: 'savings',
        balance: 50000
      }
    })
    
    expect(id).toBe('acc123')
    expect(addDoc).toHaveBeenCalledTimes(1)
  })
})

describe('getAssetAccounts', () => {
  it('获取用户的资产账户列表', async () => {
    const accounts = await getAssetAccounts('user1')
    
    expect(accounts).toHaveLength(1)
    expect(accounts[0].id).toBe('acc1')
    expect(accounts[0].name).toBe('招商银行储蓄卡')
    expect(accounts[0].type).toBe('savings')
    expect(accounts[0].balance).toBe(50000)
  })
})

describe('updateAssetAccount', () => {
  it('更新资产账户', async () => {
    await updateAssetAccount({
      userId: 'user1',
      accountId: 'acc1',
      data: { name: '新名称', balance: 60000 }
    })
    
    expect(updateDoc).toHaveBeenCalledTimes(1)
  })
})

describe('deleteAssetAccount', () => {
  it('删除资产账户', async () => {
    await deleteAssetAccount({
      userId: 'user1',
      accountId: 'acc1'
    })
    
    expect(deleteDoc).toHaveBeenCalledTimes(1)
  })
})