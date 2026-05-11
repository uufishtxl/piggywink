import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'doc123' }),
  collection: vi.fn(),
  Timestamp: { now: () => 'mock-timestamp', fromDate: (d: Date) => d },
  getFirestore: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      { id: 'exp1', data: () => ({ amount: 48, description: '午餐星巴克', categoryId: 'cat1', date: { toDate: () => new Date('2026-05-07') }, createdAt: { toDate: () => new Date() } }) },
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

// Mock fetch for Gemini API
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { parseExpense, matchCategory, saveExpenses, getExpensesByMonth } from '@/services/expense'
import { addDoc } from 'firebase/firestore'

const mockCategories = ['餐饮', '购物', '日用品', '交通', '水果', '零食', '娱乐', '通讯', '家庭', '社交', '旅行', '医疗', '书籍', '学习及兴趣', '礼金', '其他', '水电煤', '牛奶', '食材', '孩子']

describe('parseExpense (Gemini API)', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('解析单笔支出：午餐星巴克48元', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: '[{"amount":48,"description":"午餐星巴克","categoryName":"餐饮","date":"2026-05-07"}]'
            }]
          }
        }]
      })
    })

    const result = await parseExpense('午餐星巴克48元', mockCategories)
    
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(48)
    expect(result[0].description).toBe('午餐星巴克')
    expect(result[0].categoryName).toBe('餐饮')
  })

  it('解析多笔支出：奥乐齐柠檬水12.9元+食材24.4元', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: '[{"amount":12.9,"description":"柠檬水","categoryName":"零食","date":"2026-05-07"},{"amount":24.4,"description":"食材（吐司/生菜/火腿）","categoryName":"食材","date":"2026-05-07"}]'
            }]
          }
        }]
      })
    })

    const result = await parseExpense('奥乐齐花费37.3元，其中柠檬水12.9元，其他购买食材', mockCategories)
    
    expect(result).toHaveLength(2)
    expect(result[0].amount).toBe(12.9)
    expect(result[0].categoryName).toBe('零食')
    expect(result[1].amount).toBe(24.4)
    expect(result[1].categoryName).toBe('食材')
  })

  it('API 失败时抛出错误', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400
    })

    await expect(parseExpense('测试', mockCategories)).rejects.toThrow('Gemini API error')
  })
})

describe('matchCategory', () => {
  it('根据名称匹配分类ID', () => {
    const categories = [
      { id: 'cat1', name: '餐饮' },
      { id: 'cat3', name: '其他' },
    ]
    
    expect(matchCategory('餐饮', categories)).toBe('cat1')
  })
  
  it('未匹配到时返回其他分类的ID', () => {
    const categories = [
      { id: 'cat1', name: '餐饮' },
      { id: 'cat3', name: '其他' },
    ]
    
    expect(matchCategory('不存在', categories)).toBe('cat3')
  })
})

describe('saveExpenses', () => {
  it('批量保存多条支出记录', async () => {
    const ids = await saveExpenses({
      userId: 'user1',
      items: [
        { amount: 12.9, description: '柠檬水', categoryId: 'cat1', date: new Date('2026-05-07') },
        { amount: 24.4, description: '食材', categoryId: 'cat2', date: new Date('2026-05-07') },
      ]
    })
    
    expect(ids).toHaveLength(2)
    expect(addDoc).toHaveBeenCalledTimes(2)
  })
})

describe('getExpensesByMonth', () => {
  it('按月查询支出列表', async () => {
    const expenses = await getExpensesByMonth('user1', '2026-05')
    
    expect(expenses).toHaveLength(1)
    expect(expenses[0].amount).toBe(48)
  })
})