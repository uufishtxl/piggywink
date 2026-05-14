<script setup lang="ts">
interface Props {
  label: string
  amount: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
  spent: number
  remaining: number
  dailyAvailable: number
  icon?: string
}

const props = defineProps<Props>()

function formatAmount(amount: number) {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function getStatusColor(s: string) {
  if (s === 'danger') return '#EF4444'
  if (s === 'warning') return '#F59E0B'
  return '#10B981'
}
</script>

<template>
  <div class="spending-summary card">
    <!-- 头部：标签 + 图标 -->
    <div class="spending-summary__header">
      <span v-if="icon" class="spending-summary__icon">{{ icon }}</span>
      <span class="spending-summary__label">{{ label }}</span>
    </div>

    <!-- 金额行 -->
    <div class="spending-summary__amount-row">
      <span class="spending-summary__amount">{{ formatAmount(amount) }}</span>
    </div>

    <!-- 进度条 -->
    <div class="spending-summary__progress">
      <div class="progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: percentage + '%', backgroundColor: getStatusColor(status) }"
        ></div>
      </div>
      <span class="progress-bar__label">{{ percentage }}%</span>
    </div>

    <!-- 统计行 -->
    <div class="spending-summary__stats">
      <div class="spending-summary__stat">
        <span class="spending-summary__stat-label">已使用</span>
        <span class="spending-summary__stat-value">{{ formatAmount(spent) }}</span>
      </div>
      <div class="spending-summary__stat">
        <span class="spending-summary__stat-label">剩余</span>
        <span
          class="spending-summary__stat-value"
          :style="{ color: getStatusColor(status) }"
        >{{ formatAmount(remaining) }}</span>
      </div>
      <div class="spending-summary__stat">
        <span class="spending-summary__stat-label">日均可消费</span>
        <span class="spending-summary__stat-value">{{ formatAmount(dailyAvailable) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.spending-summary {
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

  &__icon {
    font-size: 24px;
  }

  &__label {
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__amount-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__amount {
    font-size: 28px;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
  }

  &__progress {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-lg;
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
  }
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: $color-bg-gray;
  border-radius: $radius-full;
  margin-right: $spacing-sm;
  overflow: hidden;

  &__fill {
    height: 100%;
    border-radius: $radius-full;
    transition: width 0.3s ease;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    min-width: 36px;
    text-align: right;
  }
}
</style>
