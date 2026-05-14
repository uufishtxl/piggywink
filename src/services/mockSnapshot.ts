import { createAssetSnapshot } from './assetSnapshot'
import type { AssetAccount } from '@/types/asset'

// 生成假的快照数据（3月和4月）
export async function seedFakeSnapshot(userId: string) {
  // 3月的快照数据
  const marchAccounts: AssetAccount[] = [
    {
      id: 'wechat-ewallet',
      name: '微信',
      type: 'ewallet',
      balance: 2000,
      createdAt: new Date('2026-03-01')
    }
  ]

  // 4月的快照数据
  const aprilAccounts: AssetAccount[] = [
    {
      id: 'wechat-ewallet',
      name: '微信',
      type: 'ewallet',
      balance: 3000,
      createdAt: new Date('2026-04-01')
    }
  ]

  // 保存3月快照
  await createAssetSnapshot({
    userId,
    month: '2026-03',
    accounts: marchAccounts
  })

  // 保存4月快照
  await createAssetSnapshot({
    userId,
    month: '2026-04',
    accounts: aprilAccounts
  })
}