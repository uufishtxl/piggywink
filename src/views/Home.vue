<script setup lang="ts">
import RecordModal from '@/components/RecordModal.vue'
import ExpenseList from '@/components/ExpenseList.vue'
import SpendingSummaryCard from '@/components/SpendingSummaryCard.vue'
import { ref, computed, onMounted, inject, watch, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getExpensesByMonth } from '@/services/expense'
import { getBudgetsByMonth } from '@/services/budget'
import { calculateBudgetSummary } from '@/services/budgetCalc'
import type { Expense } from '@/types/expense'
import type { Budget } from '@/types/budget'

const router = useRouter()
const authStore = useAuthStore()
const currentMonth = inject<ComputedRef<string>>('currentMonth')!

const expenses = ref<Expense[]>([])
const budgets = ref<Budget[]>([])
const loading = ref(false)
const showModal = ref(false)
const showTopRecordBtn = ref(false)
const recordBtnWrapper = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 加载月度数据（支出 + 预算）
async function loadMonthlyData() {
  if (!authStore.user || !currentMonth.value) return

  loading.value = true
  try {
    const [expensesData, budgetsData] = await Promise.all([
      getExpensesByMonth(authStore.user.uid, currentMonth.value),
      getBudgetsByMonth(authStore.user.uid, currentMonth.value),
    ])
    expenses.value = expensesData
    budgets.value = budgetsData
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMonthlyData()

  observer = new IntersectionObserver(
    ([entry]) => {
      showTopRecordBtn.value = !entry.isIntersecting
    },
    { threshold: 0 }
  )
  if (recordBtnWrapper.value) {
    observer.observe(recordBtnWrapper.value)
  }
})

watch(currentMonth, loadMonthlyData)

// 本月总花费
const totalSpent = computed(() =>
  expenses.value.reduce((sum, e) => sum + e.amount, 0)
)

// 真实预算汇总
const budgetSummary = computed(() =>
  calculateBudgetSummary(budgets.value, expenses.value)
)

function openRecordModal() {
  showModal.value = true
}

function handleSaved() {
  loadMonthlyData()
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
    <!-- 顶部备用记一笔按钮 -->
    <div v-if="showTopRecordBtn" class="top-record-btn">
      <button class="record-btn" @click="openRecordModal">记一笔</button>
    </div>

    <!-- 预算概览卡片 -->
    <SpendingSummaryCard
      label="本月花费"
      :amount="totalSpent"
      :percentage="budgetSummary.percentage"
      :status="budgetSummary.status"
      :spent="totalSpent"
      :remaining="budgetSummary.totalRemaining"
      :daily-available="budgetSummary.dailyAvailable"
      style="cursor: pointer"
      @click="router.push('/budgets')"
    />

    <!-- 记一笔按钮 -->
    <div ref="recordBtnWrapper" class="record-btn-wrapper">
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

.top-record-btn {
  position: sticky;
  top: -12px;
  z-index: 50;
  padding: 0 $spacing-lg;
  background: $color-bg-gray;
}

.record-btn-wrapper {
  padding: $spacing-md $spacing-lg;
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
