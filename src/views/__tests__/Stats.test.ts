// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import Stats from '@/views/Stats.vue'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
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

// Mock vue-router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
}
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => mockRouter,
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { uid: 'user1' },
    isLoggedIn: true,
    loading: false,
  })
}))

// Mock 分类 store - 包含安全和非安全类别
vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () => ({
    categories: [
      { id: 'cat1', name: '餐饮', icon: '🍜', isSafe: true, isSystem: true },
      { id: 'cat2', name: '购物', icon: '🛒', isSafe: false, isSystem: true },
      { id: 'cat3', name: '交通', icon: '🚇', isSafe: true, isSystem: true },
      { id: 'cat4', name: '娱乐', icon: '🎮', isSafe: false, isSystem: true },
    ]
  })
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

describe('Stats.vue - 分类明细只显示前3项 (#41)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('初始只显示前3个分类', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 4个分类数据，初始应只显示3个
    const items = wrapper.findAll('.stats__category-item')
    expect(items.length).toBe(3)
  })

  it('显示"查看更多"按钮', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 应该有查看更多按钮
    expect(wrapper.find('.stats__show-more-btn').exists()).toBe(true)
  })

  it('点击"查看更多"后显示全部分类', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 初始3个
    expect(wrapper.findAll('.stats__category-item').length).toBe(3)

    // 点击查看更多
    await wrapper.find('.stats__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 展开后4个全显示
    expect(wrapper.findAll('.stats__category-item').length).toBe(4)
  })

  it('展开后按钮文字变为"收起"', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 点击查看更多
    await wrapper.find('.stats__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 按钮应该仍然存在，但文字变为收起
    const button = wrapper.find('.stats__show-more-btn')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('收起')
  })

  it('分类不足3个时不显示"查看更多"按钮', async () => {
    // 修改 mock 数据：只有2个分类
    const { getExpensesByMonth } = await import('@/services/expense')
    vi.mocked(getExpensesByMonth).mockResolvedValueOnce([
      { id: 'exp1', amount: 100, description: '午餐', categoryId: 'cat1', date: new Date('2026-05-07'), createdAt: new Date() },
      { id: 'exp2', amount: 200, description: '购物', categoryId: 'cat2', date: new Date('2026-05-09'), createdAt: new Date() },
    ])

    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 只有2个分类，不应显示查看更多按钮
    expect(wrapper.find('.stats__show-more-btn').exists()).toBe(false)
  })
})

describe('Stats.vue - 支出明细排行 (#47)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('显示支出明细排行区块', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 应该有支出明细排行区块
    expect(wrapper.find('.stats__expense-ranking').exists()).toBe(true)
  })

  it('按金额从高到低排序显示', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 获取所有金额元素
    const amounts = wrapper.findAll('.stats__expense-amount')
    expect(amounts.length).toBeGreaterThan(0)

    // 验证排序：200 > 150 > 100 > 50
    expect(amounts[0].text()).toContain('200')
    expect(amounts[1].text()).toContain('150')
    expect(amounts[2].text()).toContain('100')
  })

  it('初始只显示前3个支出条目（不足3则全显）', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 4个支出条目，超过3个，应只显示3个
    const items = wrapper.findAll('.stats__expense-item')
    expect(items.length).toBe(3)
  })

  it('超过3个条目时显示"查看更多"按钮', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 4个条目（>3），应显示查看更多按钮
    const button = wrapper.find('.stats__expense-ranking button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('查看更多')
  })

  it('点击"查看更多"后展开显示30个条目', async () => {
    // 生成31个mock支出条目
    const manyExpenses = Array.from({ length: 31 }, (_, i) => ({
      id: `exp${i + 1}`,
      amount: (i + 1) * 10,
      description: `支出${i + 1}`,
      categoryId: 'cat1',
      date: new Date('2026-05-07'),
      createdAt: new Date(),
    }))
    const { getExpensesByMonth } = await import('@/services/expense')
    vi.mocked(getExpensesByMonth).mockResolvedValueOnce(manyExpenses)

    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 31个条目，初始应只显示3个
    const items = wrapper.findAll('.stats__expense-item')
    expect(items.length).toBe(3)

    // 应该有查看更多按钮
    const button = wrapper.find('.stats__expense-ranking button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('查看更多')

    // 点击查看更多
    await button.trigger('click')
    await wrapper.vm.$nextTick()

    // 展开后显示30个
    expect(wrapper.findAll('.stats__expense-item').length).toBe(30)

    // 按钮文字应变为收起
    expect(wrapper.find('.stats__expense-ranking button').text()).toContain('收起')
  })

  it('每个支出条目显示描述、分类图标和金额', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    const items = wrapper.findAll('.stats__expense-item')
    expect(items.length).toBeGreaterThan(0)

    // 第一个条目（金额200，购物）应包含图标、描述、金额
    const firstItem = items[0]
    expect(firstItem.find('.stats__expense-icon').exists()).toBe(true)
    expect(firstItem.find('.stats__expense-desc').exists()).toBe(true)
    expect(firstItem.find('.stats__expense-amount').exists()).toBe(true)
    expect(firstItem.find('.stats__expense-desc').text()).toBe('购物')
    expect(firstItem.find('.stats__expense-icon').text()).toBe('🛒')
    expect(firstItem.find('.stats__expense-amount').text()).toContain('200')
  })

  it('支出条目不足3个时不显示"查看更多"按钮', async () => {
    const { getExpensesByMonth } = await import('@/services/expense')
    vi.mocked(getExpensesByMonth).mockResolvedValueOnce([
      { id: 'exp1', amount: 100, description: '午餐', categoryId: 'cat1', date: new Date('2026-05-07'), createdAt: new Date() },
      { id: 'exp2', amount: 200, description: '购物', categoryId: 'cat2', date: new Date('2026-05-09'), createdAt: new Date() },
    ])

    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 只有2个支出（<3），不应显示查看更多按钮
    const button = wrapper.find('.stats__expense-ranking button')
    expect(button.exists()).toBe(false)
  })
})

describe('Stats.vue - 使用真实预算数据', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('使用真实预算数据而非硬编码值', async () => {
    // 预算: cat1=800, cat2=400, total=1200
    // 支出: 100+200+50+150=500
    // 剩余: 700, 百分比: 42%, status: safe
    const wrapper = mountWithProviders(Stats)

    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 百分比应为 42% 而非硬编码的 100%
    expect(wrapper.text()).toContain('42%')

    // 剩余应为 700 而非硬编码的 0
    expect(wrapper.text()).toContain('700')
  })
})

describe('Stats.vue - 对比统计入口 (#61)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('不显示筛选图标按钮', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 筛选按钮不应存在
    expect(wrapper.find('.stats__filter-btn').exists()).toBe(false)
  })

  it('不显示筛选Toast弹窗', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 筛选Toast不应存在
    expect(wrapper.find('.stats__filter-toast').exists()).toBe(false)
  })

  it('显示对比统计按钮', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 应该有对比统计按钮
    const compareBtn = wrapper.find('.stats__compare-btn')
    expect(compareBtn.exists()).toBe(true)
    expect(compareBtn.text()).toContain('查看对比统计结果')
  })

  it('点击对比统计按钮导航到对比页面', async () => {
    const wrapper = mountWithProviders(Stats)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 点击对比统计按钮
    const compareBtn = wrapper.find('.stats__compare-btn')
    await compareBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // 应该调用 router.push
    expect(mockRouter.push).toHaveBeenCalledWith('/stats/compare')
  })
})
