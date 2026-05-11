// 11种预设账户类型
export type AssetAccountType = 
  | 'savings'     // 储蓄卡
  | 'credit'      // 信用卡
  | 'ewallet'     // 电子钱包
  | 'edebt'       // 电子负债
  | 'fund'        // 理财基金
  | 'stocks'      // 股票
  | 'cash'        // 现金
  | 'transit'     // 交通卡
  | 'membership'  // 会员卡
  | 'borrowIn'    // 借入
  | 'borrowOut'   // 借出

// 账户类型预设配置
export interface AssetTypePreset {
  type: AssetAccountType
  name: string
  icon: string
  isNegative?: boolean  // 是否为负向资产
}

// 11种预设账户类型
export const ASSET_TYPE_PRESETS: AssetTypePreset[] = [
  { type: 'savings',    name: '储蓄卡',   icon: '🏦' },
  { type: 'credit',     name: '信用卡',   icon: '💳', isNegative: true },
  { type: 'ewallet',    name: '电子钱包', icon: '💹' },
  { type: 'edebt',      name: '电子负债', icon: '📉', isNegative: true },
  { type: 'fund',       name: '理财基金', icon: '📈' },
  { type: 'stocks',     name: '股票',     icon: '📊' },
  { type: 'cash',       name: '现金',     icon: '💵' },
  { type: 'transit',    name: '交通卡',   icon: '🚌' },
  { type: 'membership', name: '会员卡',   icon: '🎫' },
  { type: 'borrowIn',   name: '借入',     icon: '↖️', isNegative: true },
  { type: 'borrowOut',  name: '借出',     icon: '↘️' },
]

// 资产账户数据结构
export interface AssetAccount {
  id: string
  name: string
  type: AssetAccountType
  balance: number
  createdAt: Date
}

// 新增资产账户时的数据
export interface AssetAccountData {
  name: string
  type: AssetAccountType
  balance: number
}

// 资产快照数据结构
export interface AssetSnapshot {
  id: string
  month: string  // YYYY-MM 格式
  totalAssets: number
  totalLiabilities: number
  netAssets: number
  accountBreakdown: {
    type: AssetAccountType
    total: number
    count: number
  }[]
  createdAt: Date
}