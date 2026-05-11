// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Assets from '@/views/Assets.vue'

// Mock Firebase
const mockGetDocs = vi.fn()
const mockUpdateDoc = vi.fn()
const mockDeleteDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'acc123' }),
  collection: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp' },
  getFirestore: vi.fn(),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  doc: vi.fn(),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
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

// Mock ElMessageBox
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    }
  }
})

describe('Asset Integration - Edit and Delete', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetDocs.mockReset()
    mockUpdateDoc.mockReset()
    mockDeleteDoc.mockReset()
  })

  it('点击账户进入编辑模式', async () => {
    mockGetDocs.mockResolvedValue({
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
    })
    
    const wrapper = mount(Assets)
    
    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 点击账户项
    await wrapper.find('.asset-account-item').trigger('click')
    await wrapper.vm.$nextTick()
    
    // 应该显示编辑表单
    expect(wrapper.find('.asset-edit-form').exists()).toBe(true)
  })

  it('编辑账户后更新成功', async () => {
    // 第一次加载返回一个账户
    mockGetDocs.mockResolvedValueOnce({
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
    })
    
    // 第二次加载返回更新后的账户
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'acc1',
          data: () => ({
            name: '招商银行储蓄卡（已更新）',
            type: 'savings',
            balance: 60000,
            createdAt: { toDate: () => new Date() }
          })
        }
      ]
    })
    
    const wrapper = mount(Assets)
    
    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 点击账户项进入编辑模式
    await wrapper.find('.asset-account-item').trigger('click')
    await wrapper.vm.$nextTick()
    
    // 修改名称
    await wrapper.find('.name-input__field').setValue('招商银行储蓄卡（已更新）')
    
    // 点击保存按钮
    await wrapper.find('.submit-btn').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 应该调用更新函数
    expect(mockUpdateDoc).toHaveBeenCalled()
  })

  it('删除账户带确认弹窗', async () => {
    mockGetDocs.mockResolvedValue({
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
    })
    
    const wrapper = mount(Assets)
    
    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 点击账户项进入编辑模式
    await wrapper.find('.asset-account-item').trigger('click')
    await wrapper.vm.$nextTick()
    
    // 点击删除按钮
    await wrapper.find('.delete-btn').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // 应该调用删除函数
    expect(mockDeleteDoc).toHaveBeenCalled()
  })
})