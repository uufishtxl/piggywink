<script setup lang="ts">
import RecordModal from '@/components/RecordModal.vue'
import ExpenseList from '@/components/ExpenseList.vue'
import { ref, computed, onMounted, inject, watch, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getExpensesByMonth } from '@/services/expense'
import type { Expense } from '@/types/expense'

const router = useRouter()
const authStore = useAuthStore()
const currentMonth = inject<ComputedRef<string>>('currentMonth')!

const expenses = ref<Expense[]>([])
const loading = ref(false)

// 加载支出数据
async function loadExpenses() {
  if (!authStore.user || !currentMonth.value) return
  
  loading.value = true
  try {
    expenses.value = await getExpensesByMonth(authStore.user.uid, currentMonth.value)
  } catch (e) {
    console.error('加载支出失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadExpenses)
watch(currentMonth, loadExpenses)

// 本月总花费
const totalSpent = computed(() =>
  expenses.value.reduce((sum, e) => sum + e.amount, 0)
)

// Mock 预算（后续 Issue #7 实现）
const mockBudget = {
  total: 5000,
  get remaining() { return this.total - totalSpent.value },
  get dailyAvailable() {
    const now = new Date()
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
    return daysLeft > 0 ? Math.round(this.remaining / daysLeft) : 0
  },
  get percentage() { return Math.round((totalSpent.value / this.total) * 100) },
  get barColor() {
    if (this.percentage < 60) return '#10B981'
    if (this.percentage < 90) return '#F59E0B'
    return '#EF4444'
  }
}

function formatAmount(amount: number) {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

const showModal = ref(false)

function openRecordModal() {
  showModal.value = true
}

function handleSaved() {
  loadExpenses()
}

function handleEdit(expense: Expense) {
  router.push({
    name: 'ExpenseEdit',
    params: { id: expense.id },
    state: { expense: JSON.parse(JSON.stringify(expense)) }
  })
}
</script>

<template>
  <div class="home">
    <!-- 预算概览卡片 -->
    <div class="card budget-card" @click="router.push('/budgets')">
      <div class="budget-card__header">
        <span class="budget-card__label">本月花费</span>
        <span class="budget-card__amount">{{ formatAmount(totalSpent) }}</span>
      </div>
      <div class="budget-card__info">
        <div class="budget-card__item">
          <span class="budget-card__sublabel">预算剩余</span>
          <span class="budget-card__value">{{ formatAmount(mockBudget.remaining) }}</span>
        </div>
        <div class="budget-card__item">
          <span class="budget-card__sublabel">日均可消费</span>
          <span class="budget-card__value">{{ formatAmount(mockBudget.dailyAvailable) }}</span>
        </div>
      </div>
      <div class="budget-card__progress">
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :style="{
              width: mockBudget.percentage + '%',
              backgroundColor: mockBudget.barColor
            }"
          ></div>
        </div>
        <span class="progress-bar__label">{{ mockBudget.percentage }}%</span>
      </div>
    </div>

    <!-- 记一笔按钮 sticky -->
    <div class="record-btn-wrapper">
      <button class="record-btn" @click="openRecordModal">
        记一笔
      </button>
    </div>
    
    <RecordModal
      v-model:visible="showModal"
      @saved="handleSaved"
    />

    <!-- 每日支出列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <ExpenseList
      v-else
      :expenses="expenses"
      @edit="handleEdit"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.home {
  padding-bottom: $spacing-xl;
}

.budget-card {
  cursor: pointer;
  transition: background 0.2s;

  &:active {
    background: #f0f0f0;
  }
  &__header {
    @include flex-between;
    margin-bottom: $spacing-md;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__amount {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
  }

  &__info {
    @include flex-between;
    margin-bottom: $spacing-md;
  }

  &__item {
    flex: 1;
  }

  &__sublabel {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    display: block;
    margin-bottom: 4px;
  }

  &__value {
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__progress {
    @include flex-between;
    align-items: center;
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

.record-btn-wrapper {
  position: sticky;
  top: 48px;
  z-index: 50;
  padding: $spacing-md $spacing-lg;
  background: $color-bg-gray;
}

.record-btn {
  width: 100%;
  height: 48px;
  background: $color-primary;
  color: white;
  border-radius: $radius-lg;
  font-size: $font-size-md;
  font-weight: $font-weight-medium;

  &:active {
    background: $color-primary-dark;
  }
}

.loading {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}
</style>