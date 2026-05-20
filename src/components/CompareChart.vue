<template>
  <div class="card compare-chart" v-if="chartConfig">
    <h3>TOP3 分类对比</h3>
    <div class="compare-chart__container">
      <Bar
        :data="chartConfig.chartData"
        :options="chartConfig.chartOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import { buildBarChartConfig, type BarChartDataItem } from '@/services/chartConfig'
import type { CompareCategoryData } from '@/services/statsCompare'

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

const props = defineProps<{
  categories: CompareCategoryData[]
}>()

const barChartData = computed<BarChartDataItem[]>(() =>
  props.categories.slice(0, 3).map(cat => ({
    categoryName: cat.categoryName,
    categoryIcon: cat.categoryIcon,
    currentAmount: cat.currentAmount,
    previousAmount: cat.previousAmount,
  }))
)

const chartConfig = computed(() => {
  if (barChartData.value.length === 0) return null
  return buildBarChartConfig(barChartData.value)
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.compare-chart {
  margin-bottom: $spacing-md;

  &__container {
    height: 200px;
    margin-top: $spacing-md;
  }
}
</style>
