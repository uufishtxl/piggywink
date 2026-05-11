<script setup lang="ts">
import { computed } from 'vue'
import { ASSET_TYPE_PRESETS, type AssetAccount, type AssetAccountType } from '@/types/asset'

interface Props {
  accounts: AssetAccount[]
  loading?: boolean
  showAmounts?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showAmounts: true
})

const emit = defineEmits<{
  edit: [account: AssetAccount]
}>()

// 按类型分组
interface TypeGroup {
  type: AssetAccountType
  name: string
  icon: string
  accounts: AssetAccount[]
  total: number
}

const groupedAccounts = computed<TypeGroup[]>(() => {
  const map = new Map<AssetAccountType, AssetAccount[]>()
  
  for (const account of props.accounts) {
    if (!map.has(account.type)) {
      map.set(account.type, [])
    }
    map.get(account.type)!.push(account)
  }
  
  const result: TypeGroup[] = []
  for (const [type, accounts] of map) {
    const preset = ASSET_TYPE_PRESETS.find(p => p.type === type)
    result.push({
      type,
      name: preset?.name || '其他',
      icon: preset?.icon || '📋',
      accounts,
      total: accounts.reduce((sum, acc) => sum + acc.balance, 0)
    })
  }
  
  return result
})

function formatAmount(amount: number) {
  if (!props.showAmounts) {
    return '¥••••••'
  }
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}
</script>

<template>
  <div class="asset-account-list">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!accounts.length" class="empty">暂无资产账户</div>
    <template v-else>
      <div v-for="group in groupedAccounts" :key="group.type" class="type-group">
        <div class="type-group__header">
          <span class="type-group__icon">{{ group.icon }}</span>
          <span class="type-group__name">{{ group.name }}</span>
          <span class="type-group__total">{{ formatAmount(group.total) }}</span>
        </div>
        <div class="type-group__items">
          <div
            v-for="account in group.accounts"
            :key="account.id"
            class="asset-account-item"
            @click="$emit('edit', account)"
          >
            <div class="asset-account-item__info">
              <div class="asset-account-item__name">{{ account.name }}</div>
            </div>
            <div class="asset-account-item__balance">
              {{ formatAmount(account.balance) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.loading, .empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.type-group {
  margin-bottom: $spacing-lg;

  &__header {
    display: flex;
    align-items: center;
    padding: $spacing-sm 0;
    margin-bottom: $spacing-sm;
    border-bottom: 1px solid $color-border-light;
  }

  &__icon {
    font-size: 20px;
    margin-right: $spacing-sm;
  }

  &__name {
    flex: 1;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  &__total {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }
}

.asset-account-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  background: $color-bg;
  border-radius: $radius-lg;
  transition: background 0.2s;

  &:active {
    background: #f0f0f0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-sm;
    color: $color-text-primary;
    @include ellipsis;
  }

  &__balance {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
    flex-shrink: 0;
  }
}
</style>