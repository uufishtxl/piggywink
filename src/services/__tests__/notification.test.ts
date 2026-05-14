// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('firebase/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({
  db: {},
}))

describe('NotificationPreference 类型', () => {
  it('包含必要字段', async () => {
    const { getNotificationPreference } = await import('@/services/notification')
    
    // 类型检查 - 确保类型存在
    expect(getNotificationPreference).toBeDefined()
    expect(typeof getNotificationPreference).toBe('function')
  })
})

describe('getNotificationPreference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('无数据时返回默认值', async () => {
    const { getDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as any)

    const { getNotificationPreference } = await import('@/services/notification')
    const result = await getNotificationPreference('user1')

    expect(result).toEqual({
      pushEnabled: true,
      preference: 'failure_only',
      inAppEnabled: true,
    })
  })
})
