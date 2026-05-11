import { collection, addDoc, Timestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { ASSET_TYPE_PRESETS, type AssetAccount, type AssetSnapshot } from '@/types/asset'

// 生成资产快照
export async function createAssetSnapshot({
  userId,
  month,
  accounts
}: {
  userId: string
  month: string
  accounts: AssetAccount[]
}): Promise<string> {
  const snapshotsRef = collection(db, 'users', userId, 'assetSnapshots')
  
  // 计算总资产和总负债
  let totalAssets = 0
  let totalLiabilities = 0
  
  const breakdownMap = new Map<string, { total: number; count: number }>()
  
  for (const account of accounts) {
    const preset = ASSET_TYPE_PRESETS.find(p => p.type === account.type)
    
    if (preset?.isNegative) {
      totalLiabilities += Math.abs(account.balance)
    } else {
      totalAssets += account.balance
    }
    
    // 按类型统计
    const existing = breakdownMap.get(account.type) || { total: 0, count: 0 }
    breakdownMap.set(account.type, {
      total: existing.total + account.balance,
      count: existing.count + 1
    })
  }
  
  const netAssets = totalAssets - totalLiabilities
  
  // 构建分类明细
  const accountBreakdown = Array.from(breakdownMap.entries()).map(([type, data]) => ({
    type: type as any,
    total: data.total,
    count: data.count
  }))
  
  // 保存快照
  const docRef = await addDoc(snapshotsRef, {
    month,
    totalAssets,
    totalLiabilities,
    netAssets,
    accountBreakdown,
    createdAt: Timestamp.now(),
  })
  
  return docRef.id
}

// 获取指定月份的快照
export async function getAssetSnapshot({
  userId,
  month
}: {
  userId: string
  month: string
}): Promise<AssetSnapshot | null> {
  const snapshotsRef = collection(db, 'users', userId, 'assetSnapshots')
  const q = query(
    snapshotsRef,
    where('month', '==', month),
    limit(1)
  )
  
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  const data = doc.data()
  
  return {
    id: doc.id,
    month: data.month,
    totalAssets: data.totalAssets,
    totalLiabilities: data.totalLiabilities,
    netAssets: data.netAssets,
    accountBreakdown: data.accountBreakdown,
    createdAt: data.createdAt?.toDate?.() || new Date(),
  }
}

// 获取最新快照
export async function getLatestAssetSnapshot({
  userId
}: {
  userId: string
}): Promise<AssetSnapshot | null> {
  const snapshotsRef = collection(db, 'users', userId, 'assetSnapshots')
  const q = query(
    snapshotsRef,
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  const data = doc.data()
  
  return {
    id: doc.id,
    month: data.month,
    totalAssets: data.totalAssets,
    totalLiabilities: data.totalLiabilities,
    netAssets: data.netAssets,
    accountBreakdown: data.accountBreakdown,
    createdAt: data.createdAt?.toDate?.() || new Date(),
  }
}

// 获取上月快照
export async function getPreviousMonthSnapshot({
  userId,
  currentMonth
}: {
  userId: string
  currentMonth: string
}): Promise<AssetSnapshot | null> {
  const [year, month] = currentMonth.split('-').map(Number)
  let prevMonth = month - 1
  let prevYear = year
  
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear--
  }
  
  const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  
  return getAssetSnapshot({ userId, month: prevMonthStr })
}