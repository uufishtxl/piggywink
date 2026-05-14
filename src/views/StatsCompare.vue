<template>
  <div class="stats-compare page-container">
    <!-- A区域：类别选择器 -->
    <div class="card stats-compare__category-filter">
      <div class="stats-compare__category-header">
        <span class="stats-compare__category-title">统计类别</span>
        <span class="stats-compare__category-desc">总是包含所有的常规类别</span>
      </div>
      <button class="stats-compare__category-btn" @click="openCategoryModal">
        设置非常规类别
      </button>
    </div>

    <!-- 类别选择弹窗 -->
    <div v-if="showCategoryModal" class="stats-compare__category-modal" @click.self="cancelCategorySelection">
      <div class="stats-compare__modal-content">
        <h3>选择非常规类别</h3>
        <IconCarousel
          v-if="showCategoryModal"
          :items="iconCarouselItems"
          v-model="tempSelectedIds"
          :multiple="true"
        />
        <div class="stats-compare__modal-actions">
          <button class="stats-compare__modal-confirm" @click="confirmCategorySelection">确定</button>
        </div>
      </div>
    </div>

    <!-- B区域：总支出对比显示 -->
    <div class="card stats-compare__summary" v-if="!loading && compareData">
      <div class="stats-compare__summary-content">
        <div class="stats-compare__summary-trend">
          <el-icon v-if="totalChangePercent > 0" class="stats-compare__trend-up-icon"><ArrowUp /></el-icon>
          <el-icon v-else-if="totalChangePercent < 0" class="stats-compare__trend-down-icon"><ArrowDown /></el-icon>
          <el-icon v-else class="stats-compare__trend-neutral-icon"><Minus /></el-icon>
          <span class="stats-compare__trend-text" :class="changeClass">
            {{ totalChangePercent > 0 ? '增长' : totalChangePercent < 0 ? '降低' : '持平' }}
          </span>
        </div>
        <div class="stats-compare__summary-amount" :class="changeClass">
          {{ formatChangeAmount(totalChangePercent, currentMonthTotal, previousMonthTotal) }}
        </div>
        <div class="stats-compare__summary-label">对比上个月</div>
      </div>
    </div>
    <div v-else class="card stats-compare__loading">加载中...</div>

    <!-- C区域：TOP3柱状图 -->
    <div class="card stats-compare__chart" v-if="!loading && top3Categories.length > 0">
      <h3>TOP3 分类对比</h3>
      <div class="stats-compare__chart-container">
        <Bar
          v-if="barChartConfig"
          :data="barChartConfig.chartData"
          :options="barChartConfig.chartOptions"
        />
      </div>
    </div>

    <!-- D区域：分类明细表格 -->
    <div class="card stats-compare__table" v-if="!loading && allCategories.length > 0">
      <h3>分类明细</h3>
      <div class="stats-compare__table-content">
        <!-- 表头 -->
        <div class="stats-compare__table-header">
          <span class="stats-compare__table-col-category">类别</span>
          <span class="stats-compare__table-col-amount">上月</span>
          <span class="stats-compare__table-col-amount">本月</span>
          <span class="stats-compare__table-col-budget">预算</span>
          <span class="stats-compare__table-col-change">浮动</span>
        </div>
        
        <!-- 表格行 -->
        <div
          v-for="cat in displayedCategories"
          :key="cat.categoryId"
          class="stats-compare__table-row"
        >
          <span class="stats-compare__table-col-category">
            <span class="stats-compare__category-name">{{ cat.categoryName }}</span>
          </span>
          <span class="stats-compare__table-col-amount">
            <span v-if="cat.previousAmount > 0">{{ formatAmountRound(cat.previousAmount) }}</span>
            <span v-else class="stats-compare__new-tag">新增</span>
          </span>
          <span class="stats-compare__table-col-amount">
            {{ formatAmountRound(cat.currentAmount) }}
          </span>
          <span class="stats-compare__table-col-budget">
            <span v-if="cat.budget !== undefined && cat.budget !== null">{{ formatAmountRound(cat.budget) }}</span>
            <span v-else>-</span>
          </span>
          <span class="stats-compare__table-col-change" :class="getChangeClass(cat.changePercent)">
            <span v-if="cat.previousAmount === 0 && cat.currentAmount > 0">↑</span>
            <span v-else-if="cat.previousAmount > 0">
              <span class="stats-compare__change-icon">
                {{ cat.changePercent > 0 ? '↑' : cat.changePercent < 0 ? '↓' : '-' }}
              </span>
            </span>
            <span v-else>-</span>
          </span>
        </div>
        
        <!-- 分页控制 -->
        <div class="stats-compare__table-pagination">
          <button
            v-if="hasMoreItems"
            class="stats-compare__show-more-btn"
            @click="toggleShowMore"
          >
            {{ isExpanded ? '收起' : '查看更多' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!loading && allCategories.length === 0" class="card stats-compare__empty">
      <p>暂无数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, type Ref } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { getCompareData, getTop3Categories, type CompareData } from '@/services/statsCompare'
import { getBudgetsByMonth } from '@/services/budget'
import { buildBarChartConfig, type BarChartDataItem } from '@/services/chartConfig'
import { getExpenseMeta, type ExpenseMeta } from '@/services/expenseMeta'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import IconCarousel from '@/components/IconCarousel.vue'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const loading = ref(true)
const compareData = ref<CompareData | null>(null)

// 从 App.vue inject 月份数据
const selectedMonth = inject<Ref<string>>('statsCompareMonth')!
const statsCompareMeta = inject<Ref<ExpenseMeta | null>>('statsCompareMeta')!

// 类别选择器状态
const selectedCategoryIds = ref<string[]>([])
const showCategoryModal = ref(false)
const tempSelectedIds = ref<string[]>([])

// 非常规类别列表
const nonSafeCategories = computed(() => 
  categoriesStore.categories.filter(c => !c.isSafe)
)

// IconCarousel 使用的项目列表
const iconCarouselItems = computed(() => 
  nonSafeCategories.value.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    disabled: false,
  }))
)

// 打开类别选择弹窗
function openCategoryModal() {
  tempSelectedIds.value = [...selectedCategoryIds.value]
  showCategoryModal.value = true
}

// 确认选择
function confirmCategorySelection() {
  selectedCategoryIds.value = [...tempSelectedIds.value]
  showCategoryModal.value = false
  loadData()
}

// 取消选择
function cancelCategorySelection() {
  showCategoryModal.value = false
}

// 当前月份总支出
const currentMonthTotal = computed(() => compareData.value?.totalCurrent || 0)

// 上个月总支出
const previousMonthTotal = computed(() => compareData.value?.totalPrevious || 0)

// 总支出变化百分比
const totalChangePercent = computed(() => compareData.value?.totalChangePercent || 0)

// 变化样式类
const changeClass = computed(() => {
  if (totalChangePercent.value > 0) return 'stats-compare__change--up'
  if (totalChangePercent.value < 0) return 'stats-compare__change--down'
  return 'stats-compare__change--neutral'
})

// 格式化金额（整数）
function formatAmountValue(amount: number): string {
  return Math.round(amount).toLocaleString()
}

// 格式化金额变化（显示变化差额）
function formatChangeAmount(_percent: number, current: number, previous: number): string {
  if (previous === 0 && current > 0) return `+${formatAmountValue(current)}`
  const change = current - previous
  if (change > 0) return `+${formatAmountValue(change)}`
  if (change < 0) return formatAmountValue(change)
  return formatAmountValue(current)
}

// TOP3分类
const top3Categories = computed(() => {
  if (!compareData.value) return []
  return getTop3Categories(compareData.value.categories)
})

// 柱状图数据
const barChartData = computed<BarChartDataItem[]>(() => {
  return top3Categories.value.map(cat => ({
    categoryName: cat.categoryName,
    categoryIcon: cat.categoryIcon,
    currentAmount: cat.currentAmount,
    previousAmount: cat.previousAmount,
  }))
})

// 柱状图配置
const barChartConfig = computed(() => {
  if (barChartData.value.length === 0) return null
  return buildBarChartConfig(barChartData.value)
})

// 所有分类对比数据
const allCategories = computed(() => compareData.value?.categories || [])

// 表格分页（循环模式：3 -> 5 -> 10 -> 全部 -> 3）
const pageSizeOptions = [3, 5, 10]
const currentPageSizeIndex = ref(0)
const showAll = ref(false)

const displayedCategories = computed(() => {
  if (showAll.value) return allCategories.value
  return allCategories.value.slice(0, pageSizeOptions[currentPageSizeIndex.value])
})

const hasMoreItems = computed(() => {
  return allCategories.value.length > 3
})

const isExpanded = computed(() => {
  return showAll.value
})

function toggleShowMore() {
  if (showAll.value) {
    // 收起：从全部 -> 3
    showAll.value = false
    currentPageSizeIndex.value = 0
  } else {
    // 展开：3 -> 5 -> 10 -> 全部
    if (currentPageSizeIndex.value < pageSizeOptions.length - 1) {
      // 还没到最后一个选项，移动到下一个
      currentPageSizeIndex.value++
      // 检查是否已经达到全部
      if (pageSizeOptions[currentPageSizeIndex.value] >= allCategories.value.length) {
        showAll.value = true
      }
    } else {
      // 已到最后一个选项，展开全部
      showAll.value = true
    }
  }
}

// 格式化金额为整数（无小数点）
function formatAmountRound(amount: number): string {
  return Math.round(amount).toLocaleString()
}

// 获取变化样式类
function getChangeClass(percent: number) {
  if (percent > 0) return 'stats-compare__change--up'
  if (percent < 0) return 'stats-compare__change--down'
  return 'stats-compare__change--neutral'
}

// 加载数据
async function loadData() {
  if (!authStore.user) return

  loading.value = true
  try {
    // 获取预算数据
    const budgets = await getBudgetsByMonth(authStore.user.uid, selectedMonth.value)
    
    // 获取对比数据（传入选中的类别ID）
    const data = await getCompareData(
      authStore.user.uid,
      selectedMonth.value,
      selectedCategoryIds.value,
      categoriesStore.categories,
      budgets.map(b => ({ categoryId: b.categoryId, amount: b.amount }))
    )
    compareData.value = data
  } catch (error) {
    console.error('Error loading compare data:', error)
  } finally {
    loading.value = false
  }
}

// URL同步月份参数
watch(selectedMonth, (newMonth) => {
  router.replace({ query: { month: newMonth } })
})

// 月份切换
watch(selectedMonth, loadData)

// 加载 expenseMeta
async function loadExpenseMeta() {
  if (!authStore.user) return
  try {
    const meta = await getExpenseMeta(authStore.user.uid)
    statsCompareMeta.value = meta
  } catch (error) {
    console.error('Error loading expense meta:', error)
  }
}

onMounted(() => {
  // 默认选中所有非常规类别
  selectedCategoryIds.value = nonSafeCategories.value.map(c => c.id)
  loadExpenseMeta()
  loadData()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.stats-compare {
  &__loading {
    color: $color-text-secondary;
    padding: $spacing-xl;
    text-align: center;
  }

  // A区域：类别选择器
  &__category-filter {
    margin-bottom: $spacing-md;
    padding: $spacing-md;
  }

  &__category-header {
    display: flex;
    flex-direction: column;
    margin-bottom: $spacing-sm;
  }

  &__category-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  &__category-desc {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__category-btn {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid $color-primary;
    border-radius: $radius-md;
    background: transparent;
    color: $color-primary;
    font-size: $font-size-sm;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: rgba($color-primary, 0.05);
    }
  }

  // 类别选择弹窗
  &__category-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
  }

  &__modal-content {
    background: white;
    border-radius: $radius-lg;
    padding: $spacing-md;
    width: 90%;
    max-width: 400px;

    h3 {
      margin-bottom: $spacing-md;
      font-size: $font-size-md;
      font-weight: 600;
      text-align: center;
    }
  }

  &__modal-categories {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__modal-category-item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    border-radius: 8px;
    border: 1px solid $color-border;
    cursor: pointer;
    opacity: 0.5;
    filter: grayscale(100%);

    &--selected {
      opacity: 1;
      filter: none;
      border-color: $color-primary;
      background-color: rgba(24, 144, 255, 0.05);
    }
  }

  &__modal-category-icon {
    font-size: 1.25rem;
  }

  &__modal-category-name {
    font-size: $font-size-sm;
    font-weight: 500;
  }

  &__modal-actions {
    display: flex;
    justify-content: center;
    margin-top: $spacing-md;

    button {
      padding: $spacing-sm $spacing-lg;
      border-radius: 8px;
      border: 1px solid $color-border;
      background: white;
      cursor: pointer;
      font-size: $font-size-md;

      &:hover {
        background-color: $color-bg-gray;
      }
    }
  }

  &__modal-confirm {
    flex: 1;
    background-color: $color-primary !important;
    color: white !important;
    border-color: $color-primary !important;

    &:hover {
      opacity: 0.9;
    }
  }

  &__summary {
    margin-bottom: $spacing-md;
    padding: $spacing-lg;
  }

  &__summary-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
  }

  &__summary-trend {
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
    font-size: $font-size-md;
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

  &__summary-amount {
    font-size: 1.75rem;
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

  &__summary-label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__chart {
    margin-bottom: $spacing-md;
  }

  &__chart-container {
    height: 200px;
    margin-top: $spacing-md;
  }

  &__table {
    margin-bottom: $spacing-md;
  }

  &__table-content {
    margin-top: $spacing-md;
  }

  &__table-header {
    display: flex;
    align-items: center;
    padding: $spacing-xs 0;
    border-bottom: 2px solid $color-border;
    font-weight: 600;
    font-size: 0.75rem;
    color: $color-text-secondary;
  }

  &__table-row {
    display: flex;
    align-items: center;
    padding: $spacing-xs 0;
    border-bottom: 1px solid $color-border;
    font-size: 0.8125rem;

    &:last-child {
      border-bottom: none;
    }
  }

  &__table-col-category {
    flex: 2;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__table-col-amount {
    flex: 1.5;
    text-align: right;
    font-size: 0.75rem;
  }

  &__table-col-budget {
    flex: 1;
    text-align: right;
    font-size: 0.75rem;
    color: $color-text-secondary;
  }

  &__table-col-change {
    flex: 1;
    text-align: right;
    font-size: 0.75rem;
    font-weight: 600;

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

  &__category-name {
    font-size: 0.8125rem;
    font-weight: 500;
  }

  &__new-tag {
    color: $color-primary;
    font-weight: 500;
    font-size: 0.6875rem;
  }

  &__change-icon {
    margin-right: 1px;
    font-size: 0.875rem;
  }

  &__table-pagination {
    display: flex;
    justify-content: center;
    padding: $spacing-sm 0;
  }

  &__show-more-btn {
    background: none;
    border: none;
    color: $color-primary;
    cursor: pointer;
    font-size: 0.75rem;
    padding: $spacing-xs $spacing-md;

    &:hover {
      opacity: 0.8;
    }
  }

  &__empty {
    text-align: center;
    padding: $spacing-xl;
    color: $color-text-secondary;
  }
}
</style>
