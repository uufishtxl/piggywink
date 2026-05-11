<script setup lang="ts">
import { computed } from 'vue'
import { View, Hide } from '@element-plus/icons-vue'
import { ASSET_TYPE_PRESETS, type AssetAccount } from '@/types/asset'

interface Props {
  accounts: AssetAccount[]
  showAmounts?: boolean
  previousNetAssets?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  showAmounts: true,
  previousNetAssets: null
})

const emit = defineEmits<{
  toggleVisibility: []
}>()

// 计算净资产（考虑负向资产）
const netAssets = computed(() => {
  return props.accounts.reduce((sum, account) => {
    const preset = ASSET_TYPE_PRESETS.find(p => p.type === account.type)
    if (preset?.isNegative) {
      return sum - Math.abs(account.balance)
    }
    return sum + account.balance
  }, 0)
})

// 计算总资产（不考虑负向）
const totalAssets = computed(() => {
  return props.accounts.reduce((sum, account) => sum + account.balance, 0)
})

// 计算负向资产总额
const totalLiabilities = computed(() => {
  return props.accounts
    .filter(account => {
      const preset = ASSET_TYPE_PRESETS.find(p => p.type === account.type)
      return preset?.isNegative
    })
    .reduce((sum, account) => sum + Math.abs(account.balance), 0)
})

// 账户数量
const accountCount = computed(() => props.accounts.length)

// 计算较上月变化
const changeFromPrevious = computed(() => {
  if (props.previousNetAssets === null || props.previousNetAssets === undefined) {
    return null
  }
  
  const change = netAssets.value - props.previousNetAssets
  const percentage = props.previousNetAssets !== 0 
    ? Math.round((change / Math.abs(props.previousNetAssets)) * 100)
    : 0
  
  return {
    amount: change,
    percentage,
    isPositive: change >= 0
  }
})

function formatAmount(amount: number) {
  if (!props.showAmounts) {
    return '¥••••••'
  }
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}
</script>

<template>
  <div class="asset-summary card">
    <!-- 头部：标签 + 眼睛图标 -->
    <div class="asset-summary__header">
      <span class="asset-summary__label">净资产</span>
      <button class="asset-summary__toggle" @click="$emit('toggleVisibility')">
        <el-icon>
          <View v-if="showAmounts" />
          <Hide v-else />
        </el-icon>
      </button>
    </div>

    <!-- 金额行 -->
    <div class="asset-summary__amount-row">
      <span class="asset-summary__amount">{{ formatAmount(netAssets) }}</span>
    </div>
    
    <!-- 较上月变化 -->
    <div v-if="changeFromPrevious" class="asset-summary__change">
      <span 
        class="asset-summary__change-amount"
        :class="{
          'asset-summary__change-amount--positive': changeFromPrevious.isPositive,
          'asset-summary__change-amount--negative': !changeFromPrevious.isPositive
        }"
      >
        {{ changeFromPrevious.isPositive ? '+' : '' }}{{ formatAmount(changeFromPrevious.amount) }}
      </span>
      <span 
        class="asset-summary__change-percentage"
        :class="{
          'asset-summary__change-percentage--positive': changeFromPrevious.isPositive,
          'asset-summary__change-percentage--negative': !changeFromPrevious.isPositive
        }"
      >
        {{ changeFromPrevious.isPositive ? '+' : '' }}{{ changeFromPrevious.percentage }}%
      </span>
      <span class="asset-summary__change-label">较上月</span>
    </div>

    <!-- 统计行 -->
    <div class="asset-summary__stats">
      <div class="asset-summary__stat">
        <span class="asset-summary__stat-label">总资产</span>
        <span class="asset-summary__stat-value">{{ formatAmount(totalAssets) }}</span>
      </div>
      <div class="asset-summary__stat">
        <span class="asset-summary__stat-label">总负债</span>
        <span class="asset-summary__stat-value asset-summary__stat-value--danger">{{ formatAmount(totalLiabilities) }}</span>
      </div>
      <div class="asset-summary__stat">
        <span class="asset-summary__stat-label">账户数</span>
        <span class="asset-summary__stat-value">{{ accountCount }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.asset-summary {
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  text-align: center;

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__label {
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__toggle {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: $spacing-xs;
    border-radius: $radius-full;
    transition: background 0.2s;

    &:hover {
      background: $color-bg-gray;
    }
  }

  &__amount-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-lg;
  }

  &__amount {
    font-size: 28px;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
  }

  &__change {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-lg;
  }

  &__change-amount {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;

    &--positive {
      color: $color-success;
    }

    &--negative {
      color: $color-danger;
    }
  }

  &__change-percentage {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;

    &--positive {
      color: $color-success;
    }

    &--negative {
      color: $color-danger;
    }
  }

  &__change-label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__stats {
    display: flex;
    justify-content: space-between;
  }

  &__stat {
    flex: 1;
    text-align: center;
  }

  &__stat-label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin-bottom: 4px;
  }

  &__stat-value {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;

    &--danger {
      color: $color-danger;
    }
  }
}
</style>