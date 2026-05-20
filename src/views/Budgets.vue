<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Sort, Top, Bottom } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { getBudgetsByMonth, deleteBudget } from '@/services/budget'
import { getExpensesByMonth } from '@/services/expense'
import { calculateCategoryProgress, calculateBudgetSummary } from '@/services/budgetCalc'
import { generateRecurringBudgets } from '@/services/budgetRecurring'
import BudgetSummaryCard from '@/components/BudgetSummaryCard.vue'
import type { Budget } from '@/types/budget'
import type { Expense } from '@/types/expense'

const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const budgets = ref<Budget[]>([])
const expenses = ref<Expense[]>([])
const loading = ref(false)

// 排序状态
const sortBy = ref<'amount' | 'percentage'>('percentage')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 滑动状态
const swipedId = ref<string | null>(null)
let touchStartX = 0
let touchStartY = 0
let swiping = false

// 当前月份
const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

// 加载数据
async function loadData() {
  if (!authStore.user) return
  
  loading.value = true
  try {
    const b = await getBudgetsByMonth(authStore.user.uid, currentMonth.value)
    await generateRecurringBudgets(authStore.user.uid, currentMonth.value, b)
    
    const [budgetsData, e] = await Promise.all([
      getBudgetsByMonth(authStore.user.uid, currentMonth.value),
      getExpensesByMonth(authStore.user.uid, currentMonth.value),
    ])
    
    budgets.value = budgetsData
    expenses.value = e
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// A区：全局预算汇总
const summary = computed(() => calculateBudgetSummary(budgets.value, expenses.value))

// B区：按分类显示预算进度
interface BudgetItem {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  budgetAmount: number
  spentAmount: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
  badgeType: 'success' | 'warning' | 'danger'
  badgeLabel: string
}

const budgetItems = computed<BudgetItem[]>(() => {
  // 计算本月已过去比例
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthProgress = Math.round((today / daysInMonth) * 100)

  return budgets.value.map(b => {
    const cat = categoriesStore.categories.find(c => c.id === b.categoryId)
    const progress = calculateCategoryProgress(b, expenses.value)
    
    // 计算标签
    let badgeType: 'success' | 'warning' | 'danger' = 'success'
    let badgeLabel = '预算充足'
    
    const diff = progress.percentage - monthProgress
    if (diff > 10) {
      badgeType = 'danger'
      badgeLabel = '进度过快'
    } else if (diff < -10) {
      badgeType = 'success'
      badgeLabel = '预算充足'
    } else {
      badgeType = 'warning'
      badgeLabel = '正常'
    }
    
    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: cat?.name || '未知',
      categoryIcon: cat?.icon || '📦',
      budgetAmount: progress.budgetAmount,
      spentAmount: progress.spentAmount,
      percentage: progress.percentage,
      status: progress.status,
      badgeType,
      badgeLabel,
    }
  })
})

// 排序后的预算列表
const sortedBudgetItems = computed(() => {
  const items = [...budgetItems.value]
  items.sort((a, b) => {
    const key = sortBy.value === 'amount' ? 'budgetAmount' : 'percentage'
    const aVal = a[key]
    const bVal = b[key]
    return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
  })
  return items
})

// 切换排序方向
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 触摸事件处理
function onTouchStart(id: string, e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  swiping = false
  if (swipedId.value && swipedId.value !== id) {
    swipedId.value = null
  }
}

function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
    swiping = true
    e.preventDefault()
  }
}

function onTouchEnd(id: string, e: TouchEvent) {
  if (!swiping) return
  const dx = e.changedTouches[0].clientX - touchStartX
  if (dx < -50) {
    swipedId.value = id
  } else if (dx > 50) {
    swipedId.value = null
  }
}

function closeSwipe() {
  swipedId.value = null
}

// 删除预算
async function handleDelete(budgetId: string) {
  if (!authStore.user) return
  
  try {
    await ElMessageBox.confirm('确定删除此预算？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    await deleteBudget(authStore.user.uid, budgetId)
    ElMessage.success('已删除')
    swipedId.value = null
    await loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function formatAmount(amount: number) {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

function getStatusColor(status: string) {
  if (status === 'danger') return '#EF4444'
  if (status === 'warning') return '#F59E0B'
  return '#10B981'
}
</script>

<template>
  <div class="budgets page-container">
    <!-- A区：总预算概览 -->
    <BudgetSummaryCard
      label="本月总预算"
      :amount="summary.totalBudget"
      :percentage="summary.percentage"
      :status="summary.status"
      :spent="summary.totalSpent"
      :remaining="summary.totalRemaining"
      :daily-available="summary.dailyAvailable"
      variant="global"
    />

    <!-- B区：分类预算列表 -->
    <div class="budget-list" @click="closeSwipe">
      <div class="budget-list__sort">
        <div class="budget-list__sort--method">
          <el-icon><Sort /></el-icon>
        <button 
          class="sort-btn" 
          :class="{ active: sortBy === 'amount' }"
          @click="sortBy = 'amount'"
        >
          花费金额
        </button>
        <button 
          class="sort-btn" 
          :class="{ active: sortBy === 'percentage' }"
          @click="sortBy = 'percentage'"
        >
          花费比例
        </button>
        </div>
        <button class="sort-btn sort-btn--order" @click="toggleSortOrder">
          <el-icon>
            <Top v-if="sortOrder === 'asc'" />
            <Bottom v-else />
          </el-icon>
        </button>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!sortedBudgetItems.length" class="empty">暂无预算设置</div>
      <div v-else class="budget-list__items">
        <div
          v-for="item in sortedBudgetItems"
          :key="item.id"
          class="budget-item-wrapper"
          @touchstart="onTouchStart(item.id, $event)"
          @touchmove="onTouchMove($event)"
          @touchend="onTouchEnd(item.id, $event)"
        >
          <div
            class="budget-item"
            :class="{ 'budget-item--swiped': swipedId === item.id }"
            @click="router.push(`/budgets/${item.categoryId}`)"
          >
            <div class="budget-item__header">
              <div class="budget-item__icon">{{ item.categoryIcon }}</div>
              <span class="budget-item__name">{{ item.categoryName }}</span>
              <div class="budget-item__badges">
                <el-tag :type="item.badgeType" size="small" effect="dark">
                  {{ item.percentage }}%
                </el-tag>
                <el-tag :type="item.badgeType" size="small" effect="plain">
                  {{ item.badgeLabel }}
                </el-tag>
              </div>
              <span class="budget-item__total">{{ formatAmount(item.budgetAmount) }}</span>
            </div>
            <div class="budget-item__progress">
              <div class="progress-bar progress-bar--small">
                <div
                  class="progress-bar__fill"
                  :style="{
                    width: item.percentage + '%',
                    backgroundColor: getStatusColor(item.status)
                  }"
                ></div>
              </div>
            </div>
            <div class="budget-item__detail">
              <span class="budget-item__spent">已花费 {{ formatAmount(item.spentAmount) }}</span>
              <span class="budget-item__remaining" :style="{ color: getStatusColor(item.status) }">剩余 {{ formatAmount(item.budgetAmount - item.spentAmount) }}</span>
            </div>
          </div>
          <div class="budget-item__delete" @click="handleDelete(item.id)">
            删除
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.budgets {
  padding-bottom: $spacing-xl;
}

.budget-list {
  &__sort {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-sm;
    background: $color-bg;
    border-radius: $radius-lg;
    &--method {
      display: flex;
      gap: $spacing-md;
      align-items: center;
    }
  }
}

.loading, .empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-sm;
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

  &--small {
    height: 4px;
    margin-right: 0;
  }
}

.budget-item-wrapper {
  position: relative;
  overflow: hidden;
  margin-bottom: $spacing-sm;
  border-radius: $radius-lg;
}

.sort-btn {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  cursor: pointer;
  border-radius: $radius-sm;
  transition: all 0.2s;

  &.active {
    background: $color-primary;
    color: white;
  }

  &--order {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
  }
}

.budget-item {
  padding: $spacing-md;
  background: $color-bg;
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1;

  &--swiped {
    transform: translateX(-80px);
  }

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__icon {
    font-size: 24px;
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

  &__badges {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-right: 10px;
  }

  &__progress {
    margin-bottom: $spacing-sm;
  }

  &__detail {
    display: flex;
    justify-content: space-between;
  }

  &__spent {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__remaining {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
  }

  &__delete {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #EF4444;
    color: white;
    font-size: $font-size-sm;
    z-index: 0;
  }
}
</style>