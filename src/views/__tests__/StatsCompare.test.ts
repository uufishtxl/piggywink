// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import StatsCompare from '@/views/StatsCompare.vue'


// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  Timestamp: { fromDate: (d: Date) => d },
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
const mockRoute = {
  query: {},
}
const mockRouter = {
  replace: vi.fn(),
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
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

// Mock Vue inject
const mockMonth = ref('2026-05')
const mockMeta = ref<{ earliestMonth: string; latestMonth: string } | null>({
  earliestMonth: '2026-01',
  latestMonth: '2026-05',
})

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: (key: string) => {
      if (key === 'statsCompareMonth') return mockMonth
      if (key === 'statsCompareMeta') return mockMeta
      return undefined
    },
  }
})

// Mock services
vi.mock('@/services/monthlyStats', () => ({
  getMonthlyStats: vi.fn(),
}))

vi.mock('@/services/statsCompare', () => ({
  getCompareData: vi.fn(),
  getTop3Categories: vi.fn().mockReturnValue([]),
  formatAmount: vi.fn((amount: number) => `¥ ${amount.toFixed(2)}`),
  formatChangePercent: vi.fn((percent: number) => {
    if (percent > 0) return `+${percent.toFixed(1)}%`
    if (percent < 0) return `${percent.toFixed(1)}%`
    return '0%'
  }),
}))

vi.mock('@/services/budget', () => ({
  getBudgetsByMonth: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/expenseMeta', () => ({
  getExpenseMeta: vi.fn().mockResolvedValue({
    earliestMonth: '2026-01',
    latestMonth: '2026-05',
  }),
}))

vi.mock('@/stores/categories', () => ({
  useCategoriesStore: () => ({
    categories: [
      { id: 'cat1', name: '餐饮', icon: '🍜', isSafe: true },
      { id: 'cat2', name: '购物', icon: '🛒', isSafe: false },
      { id: 'cat3', name: '交通', icon: '🚇', isSafe: true },
      { id: 'cat4', name: '娱乐', icon: '🎮', isSafe: false },
      { id: 'cat5', name: '服饰', icon: '👗', isSafe: false },
      { id: 'cat6', name: '医疗', icon: '🏥', isSafe: false },
    ],
  }),
}))

// Mock IconCarousel component
vi.mock('@/components/IconCarousel.vue', () => ({
  default: {
    name: 'IconCarousel',
    props: ['items', 'modelValue', 'label', 'columns', 'rows'],
    emits: ['update:modelValue'],
    template: `
      <div class="icon-carousel-mock">
        <div class="icon-carousel__items">
          <div
            v-for="item in items"
            :key="item.id"
            class="icon-carousel__item"
            :class="{ active: modelValue === item.id }"
            @click="$emit('update:modelValue', item.id)"
          >
            <span class="icon-carousel__icon">{{ item.icon }}</span>
            <span class="icon-carousel__name">{{ item.name }}</span>
          </div>
        </div>
      </div>
    `,
  },
}))

import { getCompareData } from '@/services/statsCompare'

describe('StatsCompare.vue - 页面渲染', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 提供全局组件
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
  })

  it('页面正确渲染', async () => {
    vi.mocked(getCompareData).mockResolvedValue({
      currentMonth: '2026-05',
      previousMonth: '2026-04',
      categories: [],
      totalCurrent: 100,
      totalPrevious: 80,
      totalChangePercent: 25,
    })

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stats-compare').exists()).toBe(true)
  })

  it('显示loading状态', async () => {
    vi.mocked(getCompareData).mockImplementation(() => new Promise(() => {}))

    const wrapper = mount(StatsCompare)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stats-compare__loading').exists()).toBe(true)
  })

  it('加载完成后显示总支出对比', async () => {
    vi.mocked(getCompareData).mockResolvedValue({
      currentMonth: '2026-05',
      previousMonth: '2026-04',
      categories: [],
      totalCurrent: 100,
      totalPrevious: 80,
      totalChangePercent: 25,
    })

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stats-compare__summary').exists()).toBe(true)
    // 显示的是变化金额，格式为 +20（无小数点）
    expect(wrapper.text()).toContain('+20')
    expect(wrapper.text()).toContain('对比上个月')
  })

  it('显示趋势图标和趋势文字', async () => {
    vi.mocked(getCompareData).mockResolvedValue({
      currentMonth: '2026-05',
      previousMonth: '2026-04',
      categories: [],
      totalCurrent: 100,
      totalPrevious: 80,
      totalChangePercent: 25,
    })

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 应该显示增长趋势图标和文字
    expect(wrapper.find('.stats-compare__trend-up-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('增长')
    expect(wrapper.text()).toContain('+20')
    expect(wrapper.text()).toContain('对比上个月')
  })

  it('下降时显示绿色并显示降低文字', async () => {
    vi.mocked(getCompareData).mockResolvedValue({
      currentMonth: '2026-05',
      previousMonth: '2026-04',
      categories: [],
      totalCurrent: 60,
      totalPrevious: 100,
      totalChangePercent: -40,
    })

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 应该显示下降趋势图标和文字
    expect(wrapper.find('.stats-compare__trend-down-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('降低')
    // 显示的是变化金额，格式为 -40（无小数点）
    expect(wrapper.text()).toContain('-40')
  })

  it('上月无支出时显示新增金额', async () => {
    vi.mocked(getCompareData).mockResolvedValue({
      currentMonth: '2026-05',
      previousMonth: '2026-04',
      categories: [],
      totalCurrent: 100,
      totalPrevious: 0,
      totalChangePercent: 100,
    })

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 应该显示"增长"和"+100"（无小数点）
    expect(wrapper.text()).toContain('增长')
    expect(wrapper.text()).toContain('+100')
  })
})

describe('StatsCompare.vue - 类别选择器 (#60)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // 提供全局组件
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
  })

  const mockCompareData = {
    currentMonth: '2026-05',
    previousMonth: '2026-04',
    categories: [
      { categoryId: 'cat2', categoryName: '购物', categoryIcon: '🛒', currentAmount: 300, previousAmount: 200, changePercent: 50 },
      { categoryId: 'cat4', categoryName: '娱乐', categoryIcon: '🎮', currentAmount: 150, previousAmount: 100, changePercent: 50 },
      { categoryId: 'cat5', categoryName: '服饰', categoryIcon: '👗', currentAmount: 100, previousAmount: 80, changePercent: 25 },
      { categoryId: 'cat6', categoryName: '医疗', categoryIcon: '🏥', currentAmount: 50, previousAmount: 0, changePercent: 100 },
    ],
    totalCurrent: 600,
    totalPrevious: 380,
    totalChangePercent: 57.9,
  }

  it('默认选中所有非常规类别', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 默认应选中所有非常规类别（cat2, cat4, cat5, cat6）
    // A区域不再显示标签，改为在弹窗中选择
    const btn = wrapper.find('.stats-compare__category-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('设置非常规类别')
  })

  it('A区域只显示标题、说明和按钮', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // A区域应该包含：标题、说明、按钮
    const title = wrapper.find('.stats-compare__category-title')
    const desc = wrapper.find('.stats-compare__category-desc')
    const btn = wrapper.find('.stats-compare__category-btn')
    
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('统计类别')
    expect(desc.exists()).toBe(true)
    expect(desc.text()).toBe('总是包含所有的常规类别')
    expect(btn.exists()).toBe(true)
    
    // A区域不应该显示标签
    const tags = wrapper.findAll('.stats-compare__category-tag')
    expect(tags.length).toBe(0)
    const moreTag = wrapper.find('.stats-compare__category-more')
    expect(moreTag.exists()).toBe(false)
  })

  it('点击设置按钮打开弹窗', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 点击"设置非常规类别"按钮
    const setBtn = wrapper.find('.stats-compare__category-btn')
    await setBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // 应该显示弹窗
    expect(wrapper.find('.stats-compare__category-modal').exists()).toBe(true)
  })

  it('弹窗中显示IconCarousel组件', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 打开弹窗
    await wrapper.find('.stats-compare__category-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 弹窗中应显示IconCarousel mock
    expect(wrapper.find('.icon-carousel-mock').exists()).toBe(true)
  })

  it('弹窗中显示所有非常规类别', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 打开弹窗
    await wrapper.find('.stats-compare__category-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // IconCarousel mock中应显示4个非常规类别
    const modalItems = wrapper.findAll('.icon-carousel__item')
    expect(modalItems.length).toBe(4)
  })

  it('点击弹窗外关闭弹窗', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 打开弹窗
    await wrapper.find('.stats-compare__category-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stats-compare__category-modal').exists()).toBe(true)

    // 点击遮罩层关闭
    const modal = wrapper.find('.stats-compare__category-modal')
    await modal.trigger('click.self')
    await wrapper.vm.$nextTick()

    // 弹窗应关闭
    expect(wrapper.find('.stats-compare__category-modal').exists()).toBe(false)
  })

  it('点击确定应用选择', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 打开弹窗
    await wrapper.find('.stats-compare__category-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 点击确定
    const confirmBtn = wrapper.find('.stats-compare__modal-confirm')
    await confirmBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // 弹窗应关闭
    expect(wrapper.find('.stats-compare__category-modal').exists()).toBe(false)
  })

  it('弹窗中没有取消按钮', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 打开弹窗
    await wrapper.find('.stats-compare__category-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 不应该有取消按钮
    expect(wrapper.find('.stats-compare__modal-cancel').exists()).toBe(false)
  })

  it('总支出不受过滤影响', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 显示的是总变化金额（无小数点）
    expect(wrapper.text()).toContain('+220')
  })
})

describe('StatsCompare.vue - D区域分页逻辑 (#58)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
  })

  // 创建8个分类的测试数据
  const mockCategories8 = Array.from({ length: 8 }, (_, i) => ({
    categoryId: `cat${i + 1}`,
    categoryName: `类别${i + 1}`,
    categoryIcon: `📦`,
    currentAmount: 100 * (8 - i),
    previousAmount: 80 * (8 - i),
    changePercent: 25,
  }))

  const mockCompareData8 = {
    currentMonth: '2026-05',
    previousMonth: '2026-04',
    categories: mockCategories8,
    totalCurrent: 3600,
    totalPrevious: 2880,
    totalChangePercent: 25,
  }

  it('默认显示3条数据', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData8)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 默认显示3条
    const rows = wrapper.findAll('.stats-compare__table-row')
    expect(rows.length).toBe(3)
  })

  it('点击查看更多显示5条', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData8)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 点击查看更多
    const btn = wrapper.find('.stats-compare__show-more-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('查看更多')
    
    await btn.trigger('click')
    await wrapper.vm.$nextTick()

    // 应该显示5条
    const rows = wrapper.findAll('.stats-compare__table-row')
    expect(rows.length).toBe(5)
  })

  it('再次点击查看显示10条', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData8)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 点击查看更多 -> 5条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 再次点击 -> 10条（但只有8条数据，所以显示全部）
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 应该显示全部8条
    const rows = wrapper.findAll('.stats-compare__table-row')
    expect(rows.length).toBe(8)
    
    // 按钮变成收起
    const btn = wrapper.find('.stats-compare__show-more-btn')
    expect(btn.text()).toBe('收起')
  })

  it('点击收起回到3条', async () => {
    vi.mocked(getCompareData).mockResolvedValue(mockCompareData8)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 点击查看更多 -> 5条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 再次点击 -> 全部
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    // 点击收起 -> 3条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('.stats-compare__table-row')
    expect(rows.length).toBe(3)
    
    // 按钮变回查看更多
    const btn = wrapper.find('.stats-compare__show-more-btn')
    expect(btn.text()).toBe('查看更多')
  })

  it('数据少于等于3条时不显示查看更多按钮', async () => {
    const mockData3 = {
      ...mockCompareData8,
      categories: mockCategories8.slice(0, 3),
    }
    vi.mocked(getCompareData).mockResolvedValue(mockData3)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 不显示查看更多按钮
    const btn = wrapper.find('.stats-compare__show-more-btn')
    expect(btn.exists()).toBe(false)
  })

  it('12条数据时完整循环：3->5->10->全部->3', async () => {
    const mockCategories12 = Array.from({ length: 12 }, (_, i) => ({
      categoryId: `cat${i + 1}`,
      categoryName: `类别${i + 1}`,
      categoryIcon: `📦`,
      currentAmount: 100 * (12 - i),
      previousAmount: 80 * (12 - i),
      changePercent: 25,
    }))
    const mockData12 = {
      ...mockCompareData8,
      categories: mockCategories12,
    }
    vi.mocked(getCompareData).mockResolvedValue(mockData12)

    const wrapper = mount(StatsCompare)
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // 默认3条
    expect(wrapper.findAll('.stats-compare__table-row').length).toBe(3)
    expect(wrapper.find('.stats-compare__show-more-btn').text()).toBe('查看更多')

    // 点击 -> 5条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.stats-compare__table-row').length).toBe(5)
    expect(wrapper.find('.stats-compare__show-more-btn').text()).toBe('查看更多')

    // 点击 -> 10条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.stats-compare__table-row').length).toBe(10)
    expect(wrapper.find('.stats-compare__show-more-btn').text()).toBe('查看更多')

    // 点击 -> 全部12条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.stats-compare__table-row').length).toBe(12)
    expect(wrapper.find('.stats-compare__show-more-btn').text()).toBe('收起')

    // 点击收起 -> 3条
    await wrapper.find('.stats-compare__show-more-btn').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.stats-compare__table-row').length).toBe(3)
    expect(wrapper.find('.stats-compare__show-more-btn').text()).toBe('查看更多')
  })
})