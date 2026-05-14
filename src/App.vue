<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { computed, ref, watch, provide } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ArrowLeft, Setting, HomeFilled, PieChart, Wallet, Plus, Calendar } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import MonthPicker from '@/components/MonthPicker.vue'

const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const currentRoute = computed(() => router.currentRoute.value.name)
const isSettingsRoute = computed(() => currentRoute.value === 'Settings')
const isSettingsSubRoute = computed(() => 
  typeof currentRoute.value === 'string' && 
  currentRoute.value.startsWith('Settings') && 
  currentRoute.value !== 'Settings'
)
const isSubRoute = computed(() => 
  isSettingsSubRoute.value || 
  ['Budgets', 'BudgetAdd', 'BudgetDetail', 'ExpenseEdit', 'AssetTrends', 'StatsCompare'].includes(currentRoute.value as string)
)

// 当前选择的月份
const selectedMonth = ref(new Date())

// StatsCompare 相关数据
const statsCompareMonth = ref(new Date().toISOString().slice(0, 7))
const statsCompareMeta = ref<{ earliestMonth: string; latestMonth: string } | null>(null)

provide('statsCompareMonth', statsCompareMonth)
provide('statsCompareMeta', statsCompareMeta)

// 用户登录后订阅分类
watch(() => authStore.user, (user) => {
  if (user) {
    categoriesStore.subscribeToCategories()
  }
}, { immediate: true })

// 月份标题
const monthTitle = computed(() => {
  const y = selectedMonth.value.getFullYear()
  const m = String(selectedMonth.value.getMonth() + 1).padStart(2, '0')
  return `${y}年${m}月的账目明细`
})

// 月份字符串 YYYY-MM
const currentMonth = computed(() => {
  const y = selectedMonth.value.getFullYear()
  const m = String(selectedMonth.value.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})

// 暴露给子组件
provide('currentMonth', currentMonth)

function goToSettings() {
  router.push('/settings')
}

function navigateTo(name: string) {
  router.push({ name })
}

function openAddCategory() {
  window.dispatchEvent(new CustomEvent('open-add-category'))
}

function goToAddBudget() {
  router.push('/budgets/add')
}

// StatsCompare 页面月份选择器 ref
const statsCompareMonthPickerRef = ref<InstanceType<typeof MonthPicker> | null>(null)

function openStatsCompareMonthPicker() {
  statsCompareMonthPickerRef.value?.open()
}
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <!-- Loading -->
    <div v-if="authStore.loading" class="loading-screen">
      <div class="loading-spinner">🐷</div>
      <p>加载中...</p>
    </div>
    
    <!-- Login -->
    <RouterView v-else-if="!authStore.isLoggedIn" />
    
    <!-- Main App -->
    <div v-else class="app">
      <header v-if="!isSettingsRoute || isSubRoute" class="app-header">
        <div class="app-header__left">
          <template v-if="currentRoute === 'Home'">
            <el-date-picker
              ref="datePickerRef"
              v-model="selectedMonth"
              type="month"
              :clearable="false"
              class="month-picker"
            />
          </template>
          <template v-else-if="isSubRoute">
            <el-button size="large" :icon="ArrowLeft" link @click="router.back()" />
          </template>
        </div>
        <div class="app-header__center">
          <span v-if="currentRoute === 'Home'" class="header-title">{{ monthTitle }}</span>
          <span v-else-if="currentRoute === 'Stats'" class="header-title">统计</span>
          <span v-else-if="currentRoute === 'Assets'" class="header-title">资产</span>
          <span v-else-if="currentRoute === 'SettingsCategories'" class="header-title">分类管理</span>
          <span v-else-if="currentRoute === 'Budgets'" class="header-title">预算管理</span>
          <span v-else-if="currentRoute === 'BudgetAdd'" class="header-title">新增预算</span>
          <span v-else-if="currentRoute === 'BudgetDetail'" class="header-title">预算详情</span>
          <span v-else-if="currentRoute === 'ExpenseEdit'" class="header-title">编辑支出</span>
          <span v-else-if="currentRoute === 'AssetTrends'" class="header-title">资产趋势</span>
          <span v-else-if="currentRoute === 'StatsCompare'" class="header-title">对比统计结果</span>
        </div>
        <div class="app-header__right">
          <template v-if="currentRoute === 'StatsCompare'">
            <el-button size="large" :icon="Calendar" link @click="openStatsCompareMonthPicker" />
          </template>
          <el-button size="large" v-else-if="currentRoute === 'SettingsCategories'" :icon="Plus" link @click="openAddCategory" />
          <el-button size="large" v-else-if="currentRoute === 'Budgets'" :icon="Plus" link @click="goToAddBudget" />
          <el-button size="large" v-else :icon="Setting" link @click="goToSettings" />
        </div>
      </header>

      <!-- StatsCompare 月份选择器（隐藏，外部触发） -->
      <MonthPicker
        v-if="currentRoute === 'StatsCompare'"
        ref="statsCompareMonthPickerRef"
        v-model="statsCompareMonth"
      />

      <main class="app-content" :class="{ 'app-content--no-nav': isSettingsRoute }">
        <RouterView />
      </main>

      <nav v-if="!isSettingsRoute" class="app-nav">
        <button 
          class="app-nav__item" 
          :class="{ active: currentRoute === 'Home' }"
          @click="navigateTo('Home')"
        >
          <el-icon :size="20"><HomeFilled /></el-icon>
          <span class="app-nav__label">首页</span>
        </button>
        <button 
          class="app-nav__item" 
          :class="{ active: currentRoute === 'Stats' }"
          @click="navigateTo('Stats')"
        >
          <el-icon :size="20"><PieChart /></el-icon>
          <span class="app-nav__label">统计</span>
        </button>
        <button 
          class="app-nav__item" 
          :class="{ active: currentRoute === 'Assets' }"
          @click="navigateTo('Assets')"
        >
          <el-icon :size="20"><Wallet /></el-icon>
          <span class="app-nav__label">资产</span>
        </button>
      </nav>
    </div>
  </ElConfigProvider>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: $spacing-md;
}

.loading-spinner {
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 $spacing-md;
  background: $color-bg;
  border-bottom: 1px solid $color-border;
  position: sticky;
  top: 0;
  z-index: 100;

  &__left,
  &__right {
    width: 40px;
    display: flex;
    align-items: center;
  }

  &__left {
    justify-content: flex-start;
  }

  &__right {
    justify-content: flex-end;
  }

  &__center {
    flex: 1;
    text-align: center;
  }
}

.month-picker {
  width: 40px;
}

.header-title {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
  background: $color-bg-gray;
  
  &--no-nav {
    padding: 0;
  }
}

.app-nav {
  display: flex;
  justify-content: space-around;
  height: 56px;
  background: $color-bg;
  border-top: 1px solid $color-border;
  padding-bottom: env(safe-area-inset-bottom);
  
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 2px;
    color: $color-text-secondary;
    transition: color 0.2s;
    
    &.active {
      color: $color-primary;
    }
  }
  
  &__label {
    font-size: 11px;
  }
}
</style>

<!-- 非 scoped：覆盖 Element Plus date-picker 内部样式 -->
<style lang="scss">
@use '@/styles/variables' as *;

.month-picker.el-date-editor {
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;

  .el-input__wrapper {
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
    padding: 0;
    cursor: pointer;

    &:hover,
    &.is-focus {
      box-shadow: none !important;
    }
  }

  .el-input__inner {
    display: none;
  }

  .el-input__prefix {
    color: $color-text-primary;
  }
}
</style>