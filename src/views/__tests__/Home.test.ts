// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import Home from '@/views/Home.vue'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(),
  where: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  getFirestore: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp', fromDate: (d: Date) => d },
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
  }),
}))

// Mock 支出服务
vi.mock('@/services/expense', () => ({
  getExpensesByMonth: vi.fn().mockResolvedValue([
    { id: 'exp1', amount: 100, description: '午餐', categoryId: 'cat1', date: new Date('2026-05-07'), createdAt: new Date() },
    { id: 'exp2', amount: 200, description: '购物', categoryId: 'cat2', date: new Date('2026-05-09'), createdAt: new Date() },
    { id: 'exp3', amount: 50, description: '交通', categoryId: 'cat3', date: new Date('2026-05-10'), createdAt: new Date() },
    { id: 'exp4', amount: 150, description: '娱乐', categoryId: 'cat4', date: new Date('2026-05-11'), createdAt: new Date() },
  ]),
}))

// Mock 预算服务 - 返回真实预算数据
vi.mock('@/services/budget', () => ({
  getBudgetsByMonth: vi.fn().mockResolvedValue([
    { id: 'b1', categoryId: 'cat1', amount: 800, month: '2026-05', repeatType: 'none', createdAt: new Date() },
    { id: 'b2', categoryId: 'cat2', amount: 400, month: '2026-05', repeatType: 'none', createdAt: new Date() },
  ]),
}))

// 提供 inject('currentMonth') 的辅助挂载函数
function mountWithProviders(component: any) {
  const currentMonth = computed(() => '2026-05')
  return mount(component, {
    global: {
      provide: {
        currentMonth,
      },
    },
  })
}

describe('Home.vue - 使用真实预算数据', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('调用 getBudgetsByMonth 获取真实预算', async () => {
    const { getBudgetsByMonth } = await import('@/services/budget')
    mountWithProviders(Home)
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(getBudgetsByMonth).toHaveBeenCalledWith('user1', '2026-05')
  })

  it('不使用 mockBudget 硬编码数据', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const homeVuePath = path.resolve(__dirname, '../Home.vue')
    const content = fs.readFileSync(homeVuePath, 'utf-8')

    // 源码中不应包含 mockBudget
    expect(content).not.toContain('mockBudget')
  })

  it('使用 budgetSummary 计算属性驱动 SpendingSummaryCard', async () => {
    // 预算: 800 + 400 = 1200
    // 支出: 100 + 200 + 50 + 150 = 500
    // 剩余: 700, 百分比: 42%, status: safe
    const wrapper = mountWithProviders(Home)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 百分比应为 42%（而非 mockBudget 的 10%）
    expect(wrapper.text()).toContain('42%')

    // 剩余应为 700（而非 mockBudget 的 4500）
    expect(wrapper.text()).toContain('700')
  })
})

describe('Home.vue - 记一笔按钮滚动显示/隐藏 (#46)', () => {
  it('Home.vue 包含备用 top-record-btn 和 IntersectionObserver 逻辑', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const homeVuePath = path.resolve(__dirname, '../Home.vue')
    const content = fs.readFileSync(homeVuePath, 'utf-8')

    // 备用按钮存在于模板中
    expect(content).toContain('showTopRecordBtn')
    expect(content).toContain('top-record-btn')

    // 使用 IntersectionObserver 监听原按钮可见性
    expect(content).toContain('IntersectionObserver')
    expect(content).toContain('isIntersecting')

    // 原按钮不再使用 sticky
    const wrapperMatch = content.match(/\.record-btn-wrapper\s*\{([^}]+)\}/)
    expect(wrapperMatch).toBeTruthy()
    expect(wrapperMatch![1]).not.toContain('position')
  })
})
