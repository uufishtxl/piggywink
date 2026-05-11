// Gemini 解析结果
export interface ParsedExpense {
  amount: number
  description: string
  categoryName: string
  date: Date  // 默认今天
}

// 保存到 Firestore 的数据
export interface ExpenseData {
  amount: number
  description: string
  categoryId: string
  date: Date
}

// Firestore 中的支出记录
export interface Expense extends ExpenseData {
  id: string
  createdAt: Date
}