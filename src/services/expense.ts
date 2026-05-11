import { collection, addDoc, Timestamp, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { ParsedExpense, ExpenseData, Expense } from '@/types/expense'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

// Gemini 解析支出文本（支持多笔拆分）
export async function parseExpense(text: string, categoryNames: string[]): Promise<ParsedExpense[]> {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })

  const prompt = `你是一个记账助手，请解析用户的支出描述。

如果描述中包含多笔支出，请拆分成多条记录返回。

返回JSON数组格式：
[
  {
    "amount": 数字（金额），
    "description": "字符串（简短描述）",
    "categoryName": "分类名称",
    "date": "YYYY-MM-DD格式日期"
  }
]

分类名称必须从以下选择：
${categoryNames.join('、')}
注意：
- 如果是点外卖或者熟食，除非注明是餐饮一类，否则都归为食材。
- 只有牛奶是牛奶类，酸奶则是零食类。

用户输入：${text}

今天日期：${today}

只返回JSON数组，不要其他文字。`

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // 提取JSON数组
  const jsonMatch = resultText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('无法解析返回结果')
  }

  const parsedArray = JSON.parse(jsonMatch[0])

  return parsedArray.map((item: any) => ({
    amount: item.amount || 0,
    description: item.description || text,
    categoryName: item.categoryName || '其他',
    date: item.date ? new Date(item.date) : new Date(),
  }))
}

// 匹配分类名称到分类ID
export function matchCategory(
  categoryName: string,
  categories: { id: string; name: string }[]
): string {
  const matched = categories.find(c => c.name === categoryName)
  if (matched) return matched.id

  const other = categories.find(c => c.name === '其他')
  return other?.id || categories[0]?.id || ''
}

// 保存单条支出记录到 Firestore
export async function saveExpense({
  userId,
  data
}: {
  userId: string
  data: ExpenseData
}): Promise<string> {
  const expensesRef = collection(db, 'users', userId, 'expenses')
  const dateStr = data.date.toISOString().slice(0, 7) // YYYY-MM
  const docRef = await addDoc(expensesRef, {
    ...data,
    date: Timestamp.fromDate(data.date),
    month: dateStr,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

// 批量保存支出记录
export async function saveExpenses({
  userId,
  items
}: {
  userId: string
  items: ExpenseData[]
}): Promise<string[]> {
  const results: string[] = []
  for (const item of items) {
    const id = await saveExpense({ userId, data: item })
    results.push(id)
  }
  return results
}

// 获取单条支出记录
export async function getExpenseById(
  userId: string,
  expenseId: string
): Promise<Expense | null> {
  const expenseRef = doc(db, 'users', userId, 'expenses', expenseId)
  const snapshot = await getDoc(expenseRef)

  if (!snapshot.exists()) return null

  const data = snapshot.data()
  const date = data.date?.toDate?.() || new Date(data.date)
  return {
    id: snapshot.id,
    ...data,
    date,
    createdAt: data.createdAt?.toDate?.() || new Date(),
  } as Expense
}

// 按月查询支出列表
export async function getExpensesByMonth(
  userId: string,
  month: string
): Promise<Expense[]> {
  const expensesRef = collection(db, 'users', userId, 'expenses')
  const snapshot = await getDocs(expensesRef)

  return snapshot.docs
    .map(doc => {
      const data = doc.data()
      const date = data.date?.toDate?.() || new Date(data.date)
      return {
        id: doc.id,
        ...data,
        date,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as Expense
    })
    .filter(expense => {
      const y = expense.date.getFullYear()
      const m = String(expense.date.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}` === month
    })
}

// 更新支出记录
export async function updateExpense(
  userId: string,
  expenseId: string,
  data: Partial<ExpenseData>
): Promise<void> {
  const expenseRef = doc(db, 'users', userId, 'expenses', expenseId)
  const updateData: any = { ...data }
  if (data.date) {
    updateData.date = Timestamp.fromDate(data.date)
    updateData.month = data.date.toISOString().slice(0, 7)
  }
  await updateDoc(expenseRef, updateData)
}

// 删除支出记录
export async function deleteExpense(
  userId: string,
  expenseId: string
): Promise<void> {
  const expenseRef = doc(db, 'users', userId, 'expenses', expenseId)
  await deleteDoc(expenseRef)
}