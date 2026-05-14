<template>
  <div class="stats page-container">
    <!-- 当月总支出汇总卡片 -->
    <SpendingSummaryCard
      v-if="!loading"
      label="本月总支出"
      :amount="filteredTotalAmount"
      :percentage="spendingPercentage"
      :status="spendingStatus"
      :spent="filteredTotalAmount"
      :remaining="spendingRemaining"
      :daily-available="dailyAvailable"
    />
    <div v-else class="card stats__loading">加载中...</div>

    <div v-if="!loading && filteredCategoryAggregations.length > 0" class="card stats__compare-section">
      <button class="stats__compare-btn" @click="router.push('/stats/compare')">
        查看对比统计结果
      </button>
    </div>

    <!-- 分类占比环形图 -->
    <div class="card stats__pie-chart" v-if="!loading && filteredCategoryAggregations.length > 0">
      <h3>分类占比</h3>
      <div class="stats__chart-container">
        <Doughnut
          v-if="filteredCategoryAggregations.length > 0"
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>

    <!-- 分类明细列表 -->
    <div class="card stats__category-list" v-if="!loading && filteredCategoryAggregations.length > 0">
      <h3>分类明细</h3>
      <div
        v-for="cat in displayedCategories"
        :key="cat.categoryId"
        class="stats__category-item"
      >
        <span class="stats__category-icon">{{ cat.categoryIcon }}</span>
        <span class="stats__category-name">{{ cat.categoryName }}</span>
        <span class="stats__category-amount">¥ {{ cat.totalAmount.toFixed(2) }}</span>
        <span class="stats__category-percent">{{ cat.percentage.toFixed(1) }}%</span>
      </div>
      <!-- 查看更多按钮：分类超过3个时显示 -->
      <button
        v-if="filteredCategoryAggregations.length > 3"
        class="stats__show-more-btn"
        @click="showAllCategories = !showAllCategories"
      >
        {{ showAllCategories ? '收起' : '查看更多' }}
      </button>
    </div>

    <!-- 支出明细排行 -->
    <div class="card stats__expense-ranking" v-if="!loading && sortedExpenses.length > 0">
      <h3>支出明细排行</h3>
      <div v-for="exp in displayedExpenses" :key="exp.id" class="stats__expense-item">
        <span class="stats__expense-icon">{{ getCategoryIcon(exp.categoryId) }}</span>
        <span class="stats__expense-desc">{{ exp.description }}</span>
        <span class="stats__expense-amount">¥ {{ exp.amount.toFixed(2) }}</span>
      </div>
      <button v-if="sortedExpenses.length > 3" @click="showAllExpenses = !showAllExpenses">
        {{ showAllExpenses ? '收起' : '查看更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { getExpensesByMonth } from '@/services/expense'
import { getBudgetsByMonth } from '@/services/budget'
import { calculateBudgetSummary } from '@/services/budgetCalc'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { aggregateByCategory, type ExpenseWithCategory } from '@/services/statsCalc'
import { filterExpenses } from '@/services/statsFilter'
import type { Expense } from '@/types/expense'
import type { Budget } from '@/types/budget'
import SpendingSummaryCard from '@/components/SpendingSummaryCard.vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { buildDoughnutChartConfig } from '@/services/chartConfig'

ChartJS.register(ArcElement, Tooltip, ChartDataLabels)

const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const router = useRouter()
const loading = ref(true)
const showAllCategories = ref(false)
const showAllExpenses = ref(false)

// 从 App.vue inject 当前月份（与 Home.vue 一致）
const currentMonth = inject<ComputedRef<string>>('currentMonth')!

// 原始数据
const rawExpenses = ref<Expense[]>([])
const rawBudgets = ref<Budget[]>([])

// 预算汇总（基于真实预算和支出数据）
const budgetSummary = computed(() =>
  calculateBudgetSummary(rawBudgets.value, rawExpenses.value)
)

// 常规和非常规类别
const safeCategories = computed(() => categoriesStore.categories.filter(c => c.isSafe))
const nonSafeCategories = computed(() => categoriesStore.categories.filter(c => !c.isSafe))

// 原始总额
const originalTotal = computed(() => rawExpenses.value.reduce((sum, exp) => sum + exp.amount, 0))

// 筛选后的数据
const filteredExpenses = computed(() => {
  if (!authStore.user) return []

  const filterInput = {
    expenses: rawExpenses.value.map(exp => ({
      id: exp.id,
      amount: exp.amount,
      categoryId: exp.categoryId,
    })),
    categories: categoriesStore.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      isSafe: cat.isSafe,
    })),
    excludeCategoryIds: [],
    excludeSafeCategories: false,
  }

  return filterExpenses(filterInput).filteredExpenses
})

// 筛选后的总额
const filteredTotalAmount = computed(() =>
  filteredExpenses.value.reduce((sum, exp) => sum + exp.amount, 0)
)

// 筛选后的分类聚合
const filteredCategoryAggregations = computed(() => {
  const expensesWithCategory: ExpenseWithCategory[] = filteredExpenses.value.map(exp => {
    const category = categoriesStore.categories.find(c => c.id === exp.categoryId)
    return {
      id: exp.id,
      amount: exp.amount,
      categoryId: exp.categoryId,
      categoryName: category?.name || '未分类',
      categoryIcon: category?.icon || '📦',
    }
  })

  return aggregateByCategory(expensesWithCategory)
})

// 分类明细显示控制：初始只显示前3个
const displayedCategories = computed(() =>
  showAllCategories.value
    ? filteredCategoryAggregations.value
    : filteredCategoryAggregations.value.slice(0, 3)
)

// 支出明细排行：按金额降序排列
const sortedExpenses = computed(() =>
  [...rawExpenses.value].sort((a, b) => b.amount - a.amount)
)

// 支出明细显示控制：收起显示前3个，展开显示前30个
const displayedExpenses = computed(() =>
  showAllExpenses.value
    ? sortedExpenses.value.slice(0, 30)
    : sortedExpenses.value.slice(0, 3)
)

// 获取分类图标 helper
function getCategoryIcon(categoryId: string): string {
  const category = categoriesStore.categories.find(c => c.id === categoryId)
  return category?.icon || '📦'
}

// --- SpendingSummaryCard 所需计算 ---

// 从 budgetSummary 读取真实预算数据
const spendingPercentage = computed(() => budgetSummary.value.percentage)
const spendingStatus = computed<'safe' | 'warning' | 'danger'>(() => budgetSummary.value.status)
const spendingRemaining = computed(() => budgetSummary.value.totalRemaining)
const dailyAvailable = computed(() => budgetSummary.value.dailyAvailable)

// --- 饼图数据 ---

// 环形图配置（使用 chartConfig 深度模块）
const doughnutConfig = computed(() =>
  buildDoughnutChartConfig(filteredCategoryAggregations.value)
)

const chartData = computed(() => doughnutConfig.value.chartData)
const chartOptions = computed(() => doughnutConfig.value.chartOptions)

// 获取当月支出和预算
async function loadMonthlyStats() {
  if (!authStore.user) return

  loading.value = true
  try {
    const [currentExpenses, currentBudgets] = await Promise.all([
      getExpensesByMonth(authStore.user.uid, currentMonth.value),
      getBudgetsByMonth(authStore.user.uid, currentMonth.value),
    ])
    rawExpenses.value = currentExpenses
    rawBudgets.value = currentBudgets
  } catch (error) {
    console.error('Error loading monthly stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMonthlyStats()
})

watch(currentMonth, loadMonthlyStats)
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.stats {
  padding-top: $spacing-md;
  position: relative;

  &__loading {
    color: $color-text-secondary;
    padding: $spacing-xl;
    text-align: center;
  }

  &__chart-container {
    height: 260px;
    margin-top: $spacing-md;
    position: relative;
  }

  &__category-list {
    margin-top: $spacing-md;
  }

  &__category-item {
    display: flex;
    align-items: center;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $color-border;

    &:last-child {
      border-bottom: none;
    }
  }

  &__category-icon {
    font-size: 1.5rem;
    margin-right: $spacing-sm;
  }

  &__category-name {
    flex: 1;
    font-weight: 500;
  }

  &__category-amount {
    margin-right: $spacing-md;
    font-weight: 600;
  }

  &__category-percent {
    color: $color-text-secondary;
    min-width: 50px;
    text-align: right;
  }

  &__show-more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: $spacing-sm;
    margin-top: $spacing-xs;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: $color-text-secondary;

    &:hover {
      opacity: 0.7;
    }
  }

  // 支出明细排行
  &__expense-ranking {
    margin-top: $spacing-md;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: $spacing-sm;
      margin-top: $spacing-xs;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      color: $color-text-secondary;

      &:hover {
        opacity: 0.7;
      }
    }
  }

  &__expense-item {
    display: flex;
    align-items: center;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $color-border;

    &:last-child {
      border-bottom: none;
    }
  }

  &__expense-icon {
    font-size: 1.5rem;
    margin-right: $spacing-sm;
  }

  &__expense-desc {
    flex: 1;
    font-weight: 500;
  }

  &__expense-amount {
    font-weight: 600;
  }

  &__compare-section {
    margin-top: $spacing-md;
    text-align: center;
  }

  &__compare-btn {
    background: none;
    border: none;
    color: $color-primary;
    font-size: $font-size-md;
    font-weight: 500;
    cursor: pointer;
    padding: $spacing-sm $spacing-md;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
