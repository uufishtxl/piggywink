<script setup lang="ts">
import { computed } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import type { Expense } from '@/types/expense'

interface Props {
  expenses: Expense[]
  showCategory?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCategory: true,
})

const emit = defineEmits<{
  edit: [expense: Expense]
}>()

const categoriesStore = useCategoriesStore()

interface ExpenseItem {
  id: string
  icon: string
  description: string
  category: string
  amount: number
  raw: Expense
}

interface DayExpenses {
  date: string
  label: string
  total: number
  items: ExpenseItem[]
}

const groupedExpenses = computed<DayExpenses[]>(() => {
  const map = new Map<string, ExpenseItem[]>()
  
  for (const expense of props.expenses) {
    const dateStr = expense.date instanceof Date 
      ? expense.date.toISOString().split('T')[0]
      : new Date(expense.date).toISOString().split('T')[0]
    
    const category = categoriesStore.categories.find(c => c.id === expense.categoryId)
    
    const item: ExpenseItem = {
      id: expense.id,
      icon: category?.icon || '📦',
      description: expense.description,
      category: category?.name || '其他',
      amount: expense.amount,
      raw: expense,
    }
    
    if (!map.has(dateStr)) {
      map.set(dateStr, [])
    }
    map.get(dateStr)!.push(item)
  }
  
  const result: DayExpenses[] = []
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  for (const [date, items] of Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))) {
    let label = date
    if (date === today) label = '今天'
    else if (date === yesterday) label = '昨天'
    else label = date.slice(5).replace('-', '月') + '日'
    
    result.push({
      date,
      label,
      total: items.reduce((sum, item) => sum + item.amount, 0),
      items,
    })
  }
  
  return result
})

function handleClick(item: ExpenseItem) {
  emit('edit', item.raw)
}

function formatAmount(amount: number) {
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}
</script>

<template>
  <div class="expense-list">
    <div v-if="!groupedExpenses.length" class="empty">暂无记录</div>
    <template v-else>
      <div v-for="day in groupedExpenses" :key="day.date" class="expense-day">
        <div class="expense-day__header">
          <span class="expense-day__label">{{ day.label }}</span>
          <span class="expense-day__total">{{ formatAmount(day.total) }}</span>
        </div>
        <div
          v-for="item in day.items"
          :key="item.id"
          class="expense-item"
          @click="handleClick(item)"
        >
          <div class="expense-item__icon">{{ item.icon }}</div>
          <div class="expense-item__info">
            <div class="expense-item__desc">{{ item.description }}</div>
            <div v-if="showCategory" class="expense-item__category">{{ item.category }}</div>
          </div>
          <div class="expense-item__amount">-{{ formatAmount(item.amount) }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.expense-day {
  margin-bottom: $spacing-sm;

  &__header {
    @include flex-between;
    padding: $spacing-md 0 $spacing-sm;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  &__total {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
  }
}

.expense-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  background: $color-bg;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: background 0.2s;

  &:active {
    background: #f0f0f0;
  }

  &__icon {
    font-size: 24px;
    width: 40px;
    text-align: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $color-text-primary;
    margin-bottom: 2px;
    @include ellipsis;
  }

  &__category {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__amount {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
    flex-shrink: 0;
  }
}
</style>