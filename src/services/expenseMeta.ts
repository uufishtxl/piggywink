// 支出元数据服务
// 存储：users/{userId} 主文档的 expenseMeta 字段
// 数据结构：{ earliestMonth: string, latestMonth: string }

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

export interface ExpenseMeta {
  earliestMonth: string  // YYYY-MM
  latestMonth: string    // YYYY-MM
}

/**
 * 获取支出元数据
 * @param userId 用户ID
 * @returns 支出元数据，如果不存在返回null
 */
export async function getExpenseMeta(userId: string): Promise<ExpenseMeta | null> {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) return null

  const data = snapshot.data()
  return data.expenseMeta || null
}

/**
 * 更新支出元数据
 * @param userId 用户ID
 * @param month 新增/删除的月份 YYYY-MM
 */
export async function updateExpenseMeta(userId: string, month: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    // 用户文档不存在，创建并初始化元数据
    await setDoc(userRef, {
      expenseMeta: {
        earliestMonth: month,
        latestMonth: month,
      },
    })
    return
  }

  const data = snapshot.data()
  const currentMeta = data.expenseMeta as ExpenseMeta | undefined

  if (!currentMeta) {
    // 元数据不存在，初始化
    await updateDoc(userRef, {
      expenseMeta: {
        earliestMonth: month,
        latestMonth: month,
      },
    })
    return
  }

  // 比较并更新最早和最晚月份
  let newEarliest = currentMeta.earliestMonth
  let newLatest = currentMeta.latestMonth

  if (month < currentMeta.earliestMonth) {
    newEarliest = month
  }

  if (month > currentMeta.latestMonth) {
    newLatest = month
  }

  // 只有变化时才更新
  if (newEarliest !== currentMeta.earliestMonth || newLatest !== currentMeta.latestMonth) {
    await updateDoc(userRef, {
      expenseMeta: {
        earliestMonth: newEarliest,
        latestMonth: newLatest,
      },
    })
  }
}

/**
 * 重新计算支出元数据
 * 查询所有支出，重新计算最早和最晚月份
 * @param userId 用户ID
 */
export async function recalculateExpenseMeta(userId: string): Promise<void> {
  const { getDocs, collection } = await import('firebase/firestore')
  const expensesRef = collection(db, 'users', userId, 'expenses')
  const snapshot = await getDocs(expensesRef)

  if (snapshot.empty) {
    // 没有支出，清除元数据
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      expenseMeta: null,
    })
    return
  }

  let earliestMonth = ''
  let latestMonth = ''

  snapshot.docs.forEach(doc => {
    const data = doc.data()
    const month = data.month as string
    if (month) {
      if (!earliestMonth || month < earliestMonth) {
        earliestMonth = month
      }
      if (!latestMonth || month > latestMonth) {
        latestMonth = month
      }
    }
  })

  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    expenseMeta: {
      earliestMonth,
      latestMonth,
    },
  })
}
