// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetTrends from '@/views/AssetTrends.vue'

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

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { uid: 'user1' },
    isLoggedIn: true,
    loading: false,
  })
}))

describe('AssetTrends', () => {
  it('显示月份切换器', async () => {
    const wrapper = mount(AssetTrends)
    
    // Wait for async data loading
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.month-switcher').exists()).toBe(true)
    expect(wrapper.text()).toContain('2026年5月')
  })
  
  it('点击月份切换按钮', async () => {
    const wrapper = mount(AssetTrends)
    
    // Wait for async data loading
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 点击上一月按钮
    await wrapper.find('.month-switcher__btn').trigger('click')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('2026年4月')
  })
})