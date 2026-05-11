// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Assets from '@/views/Assets.vue'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'acc123' }),
  collection: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp' },
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

describe('Assets', () => {
  it('显示净资产卡片和账户列表', async () => {
    const wrapper = mount(Assets)
    
    // Wait for async data loading
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 应该显示A区净资产卡片
    expect(wrapper.find('.asset-summary').exists()).toBe(true)
    
    // 应该显示B区账户列表
    expect(wrapper.find('.asset-account-list').exists()).toBe(true)
  })
  
  it('点击添加按钮显示表单', async () => {
    const wrapper = mount(Assets)
    
    // Wait for async data loading
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 点击添加按钮
    await wrapper.find('.add-btn').trigger('click')
    
    // 应该显示表单覆盖层
    expect(wrapper.find('.assets__form-overlay').exists()).toBe(true)
    expect(wrapper.find('.asset-account-form').exists()).toBe(true)
  })
})