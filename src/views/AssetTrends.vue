<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAssetSnapshot } from '@/services/assetSnapshot'
import type { AssetSnapshot } from '@/types/asset'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const authStore = useAuthStore()
const loading = ref(true)
const currentMonth = ref('')
const snapshots = ref<AssetSnapshot[]>([])

// 初始化当前月份
const now = new Date()
currentMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

// 生成最近6个月的月份列表
const months = computed(() => {
  const result: string[] = []
  const [year, month] = currentMonth.value.split('-').map(Number)
  
  for (let i = 5; i >= 0; i--) {
    let m = month - i
    let y = year
    
    while (m <= 0) {
      m += 12
      y--
    }
    
    result.push(`${y}-${String(m).padStart(2, '0')}`)
  }
  
  return result
})

// 加载快照数据
async function loadSnapshots() {
  if (!authStore.user) return
  
  loading.value = true
  try {
    const loadedSnapshots: AssetSnapshot[] = []
    
    for (const month of months.value) {
      const snapshot = await getAssetSnapshot({
        userId: authStore.user.uid,
        month
      })
      if (snapshot) {
        loadedSnapshots.push(snapshot)
      }
    }
    
    snapshots.value = loadedSnapshots
  } catch (error) {
    console.error('Failed to load snapshots:', error)
  } finally {
    loading.value = false
  }
}

// 月份切换
function goToPreviousMonth() {
  const [year, month] = currentMonth.value.split('-').map(Number)
  let prevMonth = month - 1
  let prevYear = year
  
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear--
  }
  
  currentMonth.value = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  loadSnapshots()
}

function goToNextMonth() {
  const [year, month] = currentMonth.value.split('-').map(Number)
  let nextMonth = month + 1
  let nextYear = year
  
  if (nextMonth === 13) {
    nextMonth = 1
    nextYear++
  }
  
  // 不允许超过当前月份
  const nextDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}`
  const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  if (nextDate <= currentDate) {
    currentMonth.value = nextDate
    loadSnapshots()
  }
}

// 格式化月份显示
function formatMonth(month: string) {
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

// 图表数据
const chartData = computed(() => {
  const labels = snapshots.value.map(s => formatMonth(s.month))
  const netAssetsData = snapshots.value.map(s => s.netAssets)
  
  return {
    labels,
    datasets: [
      {
        label: '净资产',
        data: netAssetsData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// 图表选项
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `净资产: ¥${context.parsed.y.toLocaleString()}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value: any) => `¥${value.toLocaleString()}`
      }
    }
  }
}

onMounted(loadSnapshots)
</script>

<template>
  <div class="asset-trends page-container">
    <!-- 月份切换器 -->
    <div class="month-switcher">
      <button class="month-switcher__btn" @click="goToPreviousMonth">
        ‹
      </button>
      <span class="month-switcher__label">{{ formatMonth(currentMonth) }}</span>
      <button class="month-switcher__btn" @click="goToNextMonth">
        ›
      </button>
    </div>
    
    <!-- 图表 -->
    <div class="chart-container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!snapshots.length" class="empty">暂无历史数据</div>
      <Line
        v-else
        :data="chartData"
        :options="chartOptions"
        :height="300"
      />
    </div>
    
    <!-- 快照列表 -->
    <div class="snapshot-list">
      <h3>历史快照</h3>
      <div v-if="!snapshots.length" class="empty">暂无快照数据</div>
      <div v-else class="snapshot-items">
        <div v-for="snapshot in snapshots" :key="snapshot.id" class="snapshot-item">
          <div class="snapshot-item__header">
            <span class="snapshot-item__month">{{ formatMonth(snapshot.month) }}</span>
            <span class="snapshot-item__net-assets">
              净资产: ¥{{ snapshot.netAssets.toLocaleString() }}
            </span>
          </div>
          <div class="snapshot-item__details">
            <span>总资产: ¥{{ snapshot.totalAssets.toLocaleString() }}</span>
            <span>总负债: ¥{{ snapshot.totalLiabilities.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.asset-trends {
  padding-bottom: $spacing-xl;
}

.month-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  padding: $spacing-md;
  background: $color-bg;
  border-radius: $radius-lg;

  &__btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg-gray;
    border: none;
    border-radius: $radius-full;
    font-size: 20px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: $color-border;
    }
  }

  &__label {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    min-width: 120px;
    text-align: center;
  }
}

.chart-container {
  background: $color-bg;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;
  min-height: 300px;
}

.loading, .empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.snapshot-list {
  h3 {
    margin: 0 0 $spacing-md;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
  }
}

.snapshot-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.snapshot-item {
  background: $color-bg;
  border-radius: $radius-lg;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__month {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  &__net-assets {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-primary;
  }

  &__details {
    display: flex;
    gap: $spacing-lg;
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}
</style>