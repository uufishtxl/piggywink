<template>
  <div class="card compare-table" v-if="categories.length > 0">
    <h3>分类明细</h3>
    <div class="compare-table__content">
      <!-- 表头 -->
      <div class="compare-table__header">
        <span class="compare-table__col-category">类别</span>
        <span class="compare-table__col-amount">上月</span>
        <span class="compare-table__col-amount">本月</span>
        <span class="compare-table__col-budget">预算</span>
        <span class="compare-table__col-change">浮动</span>
      </div>

      <!-- 表格行 -->
      <div
        v-for="cat in displayedCategories"
        :key="cat.categoryId"
        class="compare-table__row"
      >
        <span class="compare-table__col-category">
          <span class="compare-table__category-name">{{ cat.categoryName }}</span>
        </span>
        <span class="compare-table__col-amount">
          <span v-if="cat.previousAmount > 0">{{ formatAmountRound(cat.previousAmount) }}</span>
          <span v-else class="compare-table__new-tag">新增</span>
        </span>
        <span class="compare-table__col-amount">
          {{ formatAmountRound(cat.currentAmount) }}
        </span>
        <span class="compare-table__col-budget">
          <span v-if="cat.budget !== undefined && cat.budget !== null">{{ formatAmountRound(cat.budget) }}</span>
          <span v-else>-</span>
        </span>
        <span class="compare-table__col-change" :class="getChangeClass(cat.changePercent)">
          <el-icon><ArrowUp v-if="cat.previousAmount === 0 && cat.currentAmount > 0" /><ArrowUp v-else-if="cat.previousAmount > 0 && cat.changePercent > 0" /><ArrowDown v-else-if="cat.previousAmount > 0 && cat.changePercent < 0" /><Minus v-else-if="cat.previousAmount > 0 && cat.changePercent === 0" /></el-icon>
        </span>
      </div>

      <!-- 分页控制 -->
      <div class="compare-table__pagination">
        <button
          v-if="hasMoreItems"
          class="compare-table__show-more-btn"
          @click="toggleShowMore"
        >
          {{ isExpanded ? '收起' : '查看更多' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'
import type { CompareCategoryData } from '@/services/statsCompare'

const props = defineProps<{
  categories: CompareCategoryData[]
}>()

// 表格分页（循环模式：3 -> 5 -> 10 -> 全部 -> 3）
const pageSizeOptions = [3]
const currentPageSizeIndex = ref(0)
const showAll = ref(false)

const displayedCategories = computed(() => {
  if (showAll.value) return props.categories
  return props.categories.slice(0, pageSizeOptions[currentPageSizeIndex.value])
})

const hasMoreItems = computed(() => {
  return props.categories.length > 3
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
      if (pageSizeOptions[currentPageSizeIndex.value] >= props.categories.length) {
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
  if (percent > 0) return 'compare-table__col-change--up'
  if (percent < 0) return 'compare-table__col-change--down'
  return 'compare-table__col-change--neutral'
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.compare-table {
  margin-bottom: $spacing-md;

  &__content {
    margin-top: $spacing-md;
  }

  &__header {
    display: flex;
    align-items: center;
    padding: $spacing-xs 0;
    border-bottom: 2px solid $color-border;
    font-weight: 600;
    font-size: 0.75rem;
    color: $color-text-secondary;
  }

  &__row {
    display: flex;
    align-items: center;
    padding: $spacing-xs 0;
    border-bottom: 1px solid $color-border;
    font-size: 0.8125rem;

    &:last-child {
      border-bottom: none;
    }
  }

  &__col-category {
    flex: 2;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__col-amount {
    flex: 1.5;
    text-align: right;
    font-size: 0.75rem;
  }

  &__col-budget {
    flex: 1;
    text-align: right;
    font-size: 0.75rem;
    color: $color-text-secondary;
  }

  &__col-change {
    flex: 1;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;

    .el-icon {
      margin-right: 1px;
      font-size: 0.875rem;
    }

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

  &__pagination {
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
}
</style>
