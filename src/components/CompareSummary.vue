<template>
  <div class="card compare-summary">
    <div class="compare-summary__content">
      <div class="compare-summary__trend">
        <!-- ant-design:rise-outlined -->
        <svg v-if="changePercent > 0" class="compare-summary__trend-up-icon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 1024 1024"><path fill="currentColor" d="m917 211.1l-199.2 24c-6.6.8-9.4 8.9-4.7 13.6l59.3 59.3l-226 226l-101.8-101.7c-6.3-6.3-16.4-6.2-22.6 0L100.3 754.1a8.03 8.03 0 0 0 0 11.3l45 45.2c3.1 3.1 8.2 3.1 11.3 0L433.3 534L535 635.7c6.3 6.2 16.4 6.2 22.6 0L829 364.5l59.3 59.3a8.01 8.01 0 0 0 13.6-4.7l24-199.2c.7-5.1-3.7-9.5-8.9-8.8"/></svg>
        <!-- carbon:decline -->
        <svg v-else-if="changePercent < 0" class="compare-summary__trend-down-icon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><path fill="currentColor" d="M30 14v10H20v-2h6.58L18 13.41l-4.29 4.3c-.39.39-1.03.39-1.42 0l-10-10l1.42-1.42l9.29 9.3l4.29-4.3c.39-.39 1.03-.39 1.42 0L28 20.58V14z"/></svg>
        <!-- ic:baseline-trending-flat -->
        <svg v-else class="compare-summary__trend-neutral-icon" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m22 12l-4-4v3H3v2h15v3z"/></svg>
        <span class="compare-summary__trend-text" :class="changeClass">
          {{ changePercent > 0 ? '增长' : changePercent < 0 ? '降低' : '持平' }}
        </span>
      </div>
      <div class="compare-summary__amount" :class="changeClass">
        {{ formattedChange }}
      </div>
      <div class="compare-summary__label">对比上个月</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  changePercent: number
  currentTotal: number
  previousTotal: number
}>()

const changeClass = computed(() => {
  if (props.changePercent > 0) return 'compare-summary__change--up'
  if (props.changePercent < 0) return 'compare-summary__change--down'
  return 'compare-summary__change--neutral'
})

function formatAmountValue(amount: number): string {
  return Math.round(amount).toLocaleString()
}

const formattedChange = computed(() => {
  const { changePercent: _percent, currentTotal: current, previousTotal: previous } = props
  if (previous === 0 && current > 0) return `+${formatAmountValue(current)}`
  const change = current - previous
  if (change > 0) return `+${formatAmountValue(change)}`
  if (change < 0) return formatAmountValue(change)
  return formatAmountValue(current)
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.compare-summary {
  margin-bottom: $spacing-md;
  padding: $spacing-lg;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: $spacing-xs;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__trend-up-icon {
    font-size: 1.25rem;
    color: $color-danger;
  }

  &__trend-down-icon {
    font-size: 1.25rem;
    color: $color-success;
  }

  &__trend-neutral-icon {
    font-size: 1.25rem;
    color: $color-text-secondary;
  }

  &__trend-text {
    font-size: $font-size-xs;
    font-weight: 500;

    &--up {
      color: $color-danger;
    }

    &--down {
      color: $color-success;
    }

    &--neutral {
      color: $color-text-secondary;
    }
  }

  &__amount {
    font-size: 1.5rem;
    font-weight: 700;

    &--up {
      color: $color-danger;
    }

    &--down {
      color: $color-success;
    }

    &--neutral {
      color: $color-text-secondary;
    }
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__change {
    &--up {
      color: $color-danger;
    }

    &--down {
      color: $color-success;
    }

    &--neutral {
      color: $color-text-secondary;
    }
  }
}
</style>
