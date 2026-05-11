import { collection, addDoc, Timestamp, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { AssetAccount, AssetAccountData } from '@/types/asset'

// 创建资产账户
export async function createAssetAccount({
  userId,
  data
}: {
  userId: string
  data: AssetAccountData
}): Promise<string> {
  const assetsRef = collection(db, 'users', userId, 'assets')
  const docRef = await addDoc(assetsRef, {
    ...data,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

// 获取用户的资产账户列表
export async function getAssetAccounts(userId: string): Promise<AssetAccount[]> {
  const assetsRef = collection(db, 'users', userId, 'assets') // 这是一个文件引用
  const snapshot = await getDocs(assetsRef) // 拿着文件引用 去firebase上把所有account拿过来

  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    }
  })
}

// 更新资产账户
export async function updateAssetAccount({
  userId,
  accountId,
  data
}: {
  userId: string
  accountId: string
  data: Partial<AssetAccountData>
}): Promise<void> {
  const accountRef = doc(db, 'users', userId, 'assets', accountId)
  await updateDoc(accountRef, data)
}

// 删除资产账户
export async function deleteAssetAccount({
  userId,
  accountId
}: {
  userId: string
  accountId: string
}): Promise<void> {
  const accountRef = doc(db, 'users', userId, 'assets', accountId)
  await deleteDoc(accountRef)
}