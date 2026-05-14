// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}))

vi.mock('firebase/app', () => ({ initializeApp: vi.fn() }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('@/services/firebase', () => ({
  db: {},
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { uid: 'user1' },
    isLoggedIn: true,
    loading: false,
  }),
}))

// Mock router
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRouter: () => ({
      back: vi.fn(),
    }),
  }
})

describe('NotificationsSettings - 推送通知 Switch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Mock Element Plus 组件
  const stubs = {
    'el-switch': { template: '<div class="el-switch" @click="handleChange"></div>', methods: { handleChange() { this.$emit('change') } } },
    'el-radio-group': { template: '<div><slot /></div>' },
    'el-radio': { template: '<div></div>' },
  }

  it('显示推送通知 Switch', async () => {
    const { getDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        pushEnabled: true,
        preference: 'failure_only',
        inAppEnabled: true,
      }),
    } as any)

    const { default: NotificationsSettings } = await import('@/views/NotificationsSettings.vue')
    const wrapper = mount(NotificationsSettings, { stubs })

    expect(wrapper.text()).toContain('推送通知')
  })

  it('Switch 变化时自动保存到 Firestore', async () => {
    const { getDoc, setDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        pushEnabled: true,
        preference: 'failure_only',
        inAppEnabled: true,
      }),
    } as any)
    vi.mocked(setDoc).mockResolvedValue(undefined)

    const { default: NotificationsSettings } = await import('@/views/NotificationsSettings.vue')
    const wrapper = mount(NotificationsSettings, {
      global: {
        stubs: {
          'el-switch': { template: '<div class="el-switch" @click="handleChange"></div>', methods: { handleChange() { this.$emit('change') } } },
          'el-radio-group': { template: '<div><slot /></div>' },
          'el-radio': { template: '<div></div>' },
          'el-icon': { template: '<div><slot /></div>' },
        }
      }
    })

    // 找到推送通知的 Switch 并点击
    const switches = wrapper.findAll('.el-switch')
    expect(switches.length).toBeGreaterThan(0)
    await switches[0].trigger('click')

    expect(setDoc).toHaveBeenCalled()
  })
})

describe('NotificationsSettings - 通知偏好 Radio', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('显示通知偏好选项（仅失败/全部）', async () => {
    const { getDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        pushEnabled: true,
        preference: 'failure_only',
        inAppEnabled: true,
      }),
    } as any)

    const { default: NotificationsSettings } = await import('@/views/NotificationsSettings.vue')
    const wrapper = mount(NotificationsSettings, {
      global: {
        stubs: {
          'el-switch': { template: '<div class="el-switch"></div>' },
          'el-radio-group': { template: '<div class="el-radio-group"><slot /></div>' },
          'el-radio': { template: '<div class="el-radio"><slot /></div>' },
          'el-icon': { template: '<div><slot /></div>' },
        }
      }
    })

    expect(wrapper.text()).toContain('仅失败')
    expect(wrapper.text()).toContain('全部')
  })

  it('Radio 变化时自动保存到 Firestore', async () => {
    const { getDoc, setDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        pushEnabled: true,
        preference: 'failure_only',
        inAppEnabled: true,
      }),
    } as any)
    vi.mocked(setDoc).mockResolvedValue(undefined)

    const { default: NotificationsSettings } = await import('@/views/NotificationsSettings.vue')
    const wrapper = mount(NotificationsSettings, {
      global: {
        stubs: {
          'el-switch': { template: '<div class="el-switch"></div>' },
          'el-radio-group': { 
            template: '<div class="el-radio-group" @change="handleChange"><slot /></div>',
            methods: { handleChange() { this.$emit('change', 'all') } }
          },
          'el-radio': { template: '<div class="el-radio"><slot /></div>' },
          'el-icon': { template: '<div><slot /></div>' },
        }
      }
    })

    // 触发 Radio 变化
    const radioGroup = wrapper.find('.el-radio-group')
    await radioGroup.trigger('change')

    expect(setDoc).toHaveBeenCalled()
  })
})

describe('NotificationsSettings - 内置通知 Switch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('显示内置通知 Switch', async () => {
    const { getDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        pushEnabled: true,
        preference: 'failure_only',
        inAppEnabled: true,
      }),
    } as any)

    const { default: NotificationsSettings } = await import('@/views/NotificationsSettings.vue')
    const wrapper = mount(NotificationsSettings, {
      global: {
        stubs: {
          'el-switch': { template: '<div class="el-switch"></div>' },
          'el-radio-group': { template: '<div class="el-radio-group"><slot /></div>' },
          'el-radio': { template: '<div class="el-radio"><slot /></div>' },
          'el-icon': { template: '<div><slot /></div>' },
        }
      }
    })

    expect(wrapper.text()).toContain('内置通知')
  })

  it('Switch 变化时自动保存到 Firestore', async () => {
    const { getDoc, setDoc } = await import('firebase/firestore')
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        pushEnabled: true,
        preference: 'failure_only',
        inAppEnabled: true,
      }),
    } as any)
    vi.mocked(setDoc).mockResolvedValue(undefined)

    const { default: NotificationsSettings } = await import('@/views/NotificationsSettings.vue')
    const wrapper = mount(NotificationsSettings, {
      global: {
        stubs: {
          'el-switch': {
            template: '<div class="el-switch" @click="handleChange"></div>',
            methods: { handleChange() { this.$emit('change') } }
          },
          'el-radio-group': { template: '<div class="el-radio-group"><slot /></div>' },
          'el-radio': { template: '<div class="el-radio"><slot /></div>' },
          'el-icon': { template: '<div><slot /></div>' },
        }
      }
    })

    // 找到内置通知的 Switch 并点击（第二个）
    const switches = wrapper.findAll('.el-switch')
    expect(switches.length).toBeGreaterThanOrEqual(2)
    await switches[1].trigger('click')

    expect(setDoc).toHaveBeenCalled()
  })
})
