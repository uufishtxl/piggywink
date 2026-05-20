<template>
  <div class="stats-compare page-container">
    <!-- A区域：类别选择器 -->
    <CompareCategoryFilter
      :items="iconCarouselItems"
      :selectedIds="selectedCategoryIds"
      @update:selectedIds="onCategoryChange"
    />

    <!-- B区域：总支出对比显示 -->
    <CompareSummary
      v-if="!loading && compareData"
      :changePercent="totalChangePercent"
      :currentTotal="currentMonthTotal"
      :previousTotal="previousMonthTotal"
    />
    <div v-else class="card stats-compare__loading">加载中...</div>

    <!-- C区域：TOP3柱状图 -->
    <CompareChart
      v-if="!loading && compareData"
      :categories="allCategories"
    />

    <!-- D区域：分类明细表格 -->
    <CompareTable
      v-if="!loading"
      :categories="allCategories"
    />

    <!-- 无数据提示 -->
    <div v-if="!loading && allCategories.length === 0" class="card stats-compare__empty">
      <p>暂无数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { getCompareData, type CompareData } from '@/services/statsCompare'
import { getBudgetsByMonth } from '@/services/budget'
import { getExpenseMeta, type ExpenseMeta } from '@/services/expenseMeta'
import CompareCategoryFilter from '@/components/CompareCategoryFilter.vue'
import CompareSummary from '@/components/CompareSummary.vue'
import CompareChart from '@/components/CompareChart.vue'
import CompareTable from '@/components/CompareTable.vue'

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

// 类别选择变更
function onCategoryChange(ids: string[]) {
  selectedCategoryIds.value = ids
  loadData()
}

// 当前月份总支出
const currentMonthTotal = computed(() => compareData.value?.totalCurrent || 0)

// 上个月总支出
const previousMonthTotal = computed(() => compareData.value?.totalPrevious || 0)

// 总支出变化百分比
const totalChangePercent = computed(() => compareData.value?.totalChangePercent || 0)

// 所有分类对比数据
const allCategories = computed(() => compareData.value?.categories || [])

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

onMounted(async () => {
  // 等待类别加载完成后，默认选中所有非常规类别
  if (categoriesStore.categories.length === 0) {
    await categoriesStore.loadCategories()
  }
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

  &__empty {
    text-align: center;
    padding: $spacing-xl;
    color: $color-text-secondary;
  }
}
</style>
