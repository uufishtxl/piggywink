<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { getBudgetsByMonth, updateBudget } from '@/services/budget'
import { getExpensesByMonth } from '@/services/expense'
import BudgetSummaryCard from '@/components/BudgetSummaryCard.vue'
import ExpenseList from '@/components/ExpenseList.vue'
import type { Budget, RepeatType } from '@/types/budget'
import type { Expense } from '@/types/expense'

const route = useRoute()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const budget = ref<Budget | null>(null)
const expenses = ref<Expense[]>([])
const loading = ref(false)

const categoryId = computed(() => route.params.categoryId as string)
const category = computed(() => categoriesStore.categories.find(c => c.id === categoryId.value))

// 当前月份
const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

// 重复周期标签
const repeatLabel: Record<RepeatType, string> = {
  'none': '本月',
  'monthly': '本月',
  'quarterly': '本季',
  'semi-annually': '本半年',
  'annually': '本年',
}

const budgetRepeatLabel = computed(() => {
  if (!budget.value) return '本月'
  return repeatLabel[budget.value.repeatType] || '本月'
})

// 计算进度数据
const spentAmount = computed(() => 
  expenses.value.reduce((sum, e) => sum + e.amount, 0)
)

const remainingAmount = computed(() => 
  (budget.value?.amount || 0) - spentAmount.value
)

const percentage = computed(() => {
  if (!budget.value || budget.value.amount <= 0) return 0
  return Math.min(Math.round((spentAmount.value / budget.value.amount) * 100), 100)
})

const status = computed(() => {
  if (percentage.value >= 90) return 'danger'
  if (percentage.value >= 60) return 'warning'
  return 'safe'
})

const dailyAvailable = computed(() => {
  const now = new Date()
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
  return daysLeft > 0 ? Math.round(remainingAmount.value / daysLeft) : 0
})

// 加载数据
async function loadData() {
  if (!authStore.user) return
  
  loading.value = true
  try {
    const [budgets, exps] = await Promise.all([
      getBudgetsByMonth(authStore.user.uid, currentMonth.value),
      getExpensesByMonth(authStore.user.uid, currentMonth.value),
    ])
    
    budget.value = budgets.find(b => b.categoryId === categoryId.value) || null
    expenses.value = exps.filter(e => e.categoryId === categoryId.value)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

async function handleUpdate(amount: number) {
  if (!budget.value || !authStore.user) return
  
  try {
    await updateBudget(authStore.user.uid, budget.value.id, { amount })
    ElMessage.success('已更新')
    await loadData()
  } catch (e) {
    ElMessage.error('更新失败')
  }
}
</script>

<template>
  <div class="budget-detail page-container">
    <div v-if="loading" class="loading">加载中...</div>
    
    <template v-else-if="budget">
      <!-- A区：预算概览 -->
      <BudgetSummaryCard
        :icon="category?.icon"
        :label="`${category?.name}${budgetRepeatLabel}预算`"
        :amount="budget.amount"
        :percentage="percentage"
        :status="status"
        :spent="spentAmount"
        :remaining="remainingAmount"
        :daily-available="dailyAvailable"
        editable
        variant="detail"
        @update="handleUpdate"
      />

      <!-- 支出列表 -->
      <div class="expense-section">
        <div class="expense-section__title">{{ budgetRepeatLabel }}支出明细</div>
        <div v-if="loading" class="loading">加载中...</div>
        <ExpenseList v-else :expenses="expenses" :show-category="false" />
      </div>
    </template>
    
    <div v-else class="empty">未找到预算设置</div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.budget-detail {
  padding-bottom: $spacing-xl;
}

.loading, .empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.expense-section {
  &__title {
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    margin-bottom: $spacing-md;
  }
}
</style>