import { collection, addDoc, Timestamp, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { BudgetData, Budget } from '@/types/budget'

// 保存预算到 Firestore
export async function saveBudget({
  userId,
  data
}: {
  userId: string
  data: BudgetData
}): Promise<string> {
  const budgetsRef = collection(db, 'users', userId, 'budgets')
  const docRef = await addDoc(budgetsRef, {
    ...data,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

// 按月查询预算列表
export async function getBudgetsByMonth(
  userId: string,
  month: string
): Promise<Budget[]> {
  const budgetsRef = collection(db, 'users', userId, 'budgets')
  const q = query(budgetsRef, where('month', '==', month))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Budget[]
}

// 删除预算
export async function deleteBudget(
  userId: string,
  budgetId: string
): Promise<void> {
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId)
  await deleteDoc(budgetRef)
}

// 更新预算
export async function updateBudget(
  userId: string,
  budgetId: string,
  data: Partial<BudgetData>
): Promise<void> {
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId)
  await updateDoc(budgetRef, data)
}