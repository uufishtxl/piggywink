<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Edit } from '@element-plus/icons-vue'

interface Props {
  icon?: string
  label: string
  amount: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
  spent: number
  remaining: number
  dailyAvailable: number
  editable?: boolean
  variant?: 'global' | 'detail'
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  variant: 'global',
})

const emit = defineEmits<{
  update: [amount: number]
}>()

const editing = ref(false)
const saving = ref(false)
const editAmount = ref<number | string>(0)
const editInputRef = ref<HTMLInputElement | null>(null)

function formatAmount(amount: number) {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function getStatusColor(s: string) {
  if (s === 'danger') return '#EF4444'
  if (s === 'warning') return '#F59E0B'
  return '#10B981'
}

function startEdit() {
  editAmount.value = props.amount
  editing.value = true
  saving.value = false
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

function cancelEdit() {
  if (!saving.value) {
    editing.value = false
  }
}

function handleFocus() {
  if (editAmount.value === 0) {
    editAmount.value = ''
  }
}

function saveEdit() {
  const num = Number(editAmount.value)
  if (!num || num <= 0) return
  saving.value = true
  emit('update', num)
}
</script>

<template>
  <div class="budget-summary card" :class="`budget-summary--${variant}`">
    <!-- 头部：标签 + 图标 -->
    <div class="budget-summary__header">
      <span v-if="icon" class="budget-summary__icon">{{ icon }}</span>
      <span class="budget-summary__label">{{ label }}</span>
    </div>

    <!-- 金额行 -->
    <div class="budget-summary__amount-row">
      <template v-if="!editing || !editable">
        <span class="budget-summary__amount">{{ formatAmount(amount) }}</span>
        <el-button v-if="editable" :icon="Edit" link @click="startEdit" />
      </template>
      <template v-else>
        <input
          ref="editInputRef"
          v-model="editAmount"
          type="number"
          class="budget-summary__amount-input"
          min="0"
          step="100"
          :disabled="saving"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          @blur="cancelEdit"
          @focus="handleFocus"
        />
        <el-button link type="primary" :disabled="saving" @mousedown.prevent="saveEdit">✓</el-button>
      </template>
    </div>

    <!-- 进度条 -->
    <div class="budget-summary__progress">
      <div class="progress-bar">
        <div
          class="progress-bar__fill"
          :style="{ width: percentage + '%', backgroundColor: getStatusColor(status) }"
        ></div>
      </div>
      <span class="progress-bar__label">{{ percentage }}%</span>
    </div>

    <!-- 统计行 -->
    <div class="budget-summary__stats">
      <div class="budget-summary__stat">
        <span class="budget-summary__stat-label">已使用</span>
        <span class="budget-summary__stat-value">{{ formatAmount(spent) }}</span>
      </div>
      <div class="budget-summary__stat">
        <span class="budget-summary__stat-label">剩余</span>
        <span class="budget-summary__stat-value" :style="{ color: getStatusColor(status) }">{{ formatAmount(remaining) }}</span>
      </div>
      <div class="budget-summary__stat">
        <span class="budget-summary__stat-label">日均可消费</span>
        <span class="budget-summary__stat-value">{{ formatAmount(dailyAvailable) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.budget-summary {
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;

  // global 变体居中
  &--global {
    text-align: center;
  }

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

  &__amount-input {
    font-size: 28px;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
    border: none;
    border-bottom: 2px solid $color-primary;
    outline: none;
    width: 150px;
    background: transparent;
    padding: 0;
    text-align: center;
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