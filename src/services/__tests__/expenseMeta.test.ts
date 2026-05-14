import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
const mockDocRef = { id: 'mock-doc-ref' }
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => mockDocRef),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({
  db: 'mock-db',
}))

import { getExpenseMeta, updateExpenseMeta } from '@/services/expenseMeta'
import { getDoc, updateDoc, setDoc } from 'firebase/firestore'

describe('getExpenseMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('返回正确的元数据', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        expenseMeta: {
          earliestMonth: '2024-01',
          latestMonth: '2026-05',
        },
      }),
    } as any)

    const result = await getExpenseMeta('user1')

    expect(result).toEqual({
      earliestMonth: '2024-01',
      latestMonth: '2026-05',
    })
  })

  it('用户文档不存在时返回null', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any)

    const result = await getExpenseMeta('user1')

    expect(result).toBeNull()
  })

  it('元数据不存在时返回null', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    } as any)

    const result = await getExpenseMeta('user1')

    expect(result).toBeNull()
  })
})

describe('updateExpenseMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('首次保存时正确初始化', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any)

    vi.mocked(setDoc).mockResolvedValue(undefined)

    await updateExpenseMeta('user1', '2026-05')

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        expenseMeta: {
          earliestMonth: '2026-05',
          latestMonth: '2026-05',
        },
      }
    )
  })

  it('保存更早月份时更新earliestMonth', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        expenseMeta: {
          earliestMonth: '2026-03',
          latestMonth: '2026-05',
        },
      }),
    } as any)

    vi.mocked(updateDoc).mockResolvedValue(undefined)

    await updateExpenseMeta('user1', '2026-01')

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        expenseMeta: {
          earliestMonth: '2026-01',
          latestMonth: '2026-05',
        },
      }
    )
  })

  it('保存更晚月份时更新latestMonth', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        expenseMeta: {
          earliestMonth: '2026-01',
          latestMonth: '2026-03',
        },
      }),
    } as any)

    vi.mocked(updateDoc).mockResolvedValue(undefined)

    await updateExpenseMeta('user1', '2026-05')

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        expenseMeta: {
          earliestMonth: '2026-01',
          latestMonth: '2026-05',
        },
      }
    )
  })

  it('月份在范围内时不更新', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        expenseMeta: {
          earliestMonth: '2026-01',
          latestMonth: '2026-05',
        },
      }),
    } as any)

    await updateExpenseMeta('user1', '2026-03')

    // 不应该调用updateDoc
    expect(updateDoc).not.toHaveBeenCalled()
  })

  it('用户文档不存在时创建并初始化', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any)

    vi.mocked(setDoc).mockResolvedValue(undefined)

    await updateExpenseMeta('user1', '2026-05')

    expect(setDoc).toHaveBeenCalled()
  })

  it('元数据不存在时初始化', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    } as any)

    vi.mocked(updateDoc).mockResolvedValue(undefined)

    await updateExpenseMeta('user1', '2026-05')

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        expenseMeta: {
          earliestMonth: '2026-05',
          latestMonth: '2026-05',
        },
      }
    )
  })
})
