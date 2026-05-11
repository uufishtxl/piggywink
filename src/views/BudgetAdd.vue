<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { saveBudget, getBudgetsByMonth } from '@/services/budget'
import IconCarousel from '@/components/IconCarousel.vue'
import type { RepeatType } from '@/types/budget'

const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const amount = ref<number | string>(0)
const selectedCategoryId = ref<string>('')
const repeatType = ref<RepeatType>('none')
const loading = ref(false)
const budgetedCategoryIds = ref<Set<string>>(new Set())

const repeatOptions = [
  { value: 'none', label: '不重复' },
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季度' },
  { value: 'semi-annually', label: '每半年' },
  { value: 'annually', label: '每年' },
]

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

onMounted(async () => {
  if (!authStore.user) return
  const budgets = await getBudgetsByMonth(authStore.user.uid, currentMonth.value)
  budgetedCategoryIds.value = new Set(budgets.map(b => b.categoryId))
})

const categories = computed(() => {
  const all = categoriesStore.categories
  const budgeted = budgetedCategoryIds.value
  
  const available = all.filter(c => !budgeted.has(c.id))
  const disabled = all.filter(c => budgeted.has(c.id))
  
  return [
    ...available.map(c => ({ ...c, disabled: false })),
    ...disabled.map(c => ({ ...c, disabled: true })),
  ]
})

function handleAmountFocus() {
  if (amount.value === 0) {
    amount.value = ''
  }
}

async function handleSubmit() {
  if (!selectedCategoryId.value) {
    ElMessage.warning('请选择分类')
    return
  }
  
  const num = Number(amount.value)
  if (!num || num <= 0) {
    ElMessage.warning('请输入有效金额')
    return
  }
  
  if (!authStore.user) return
  
  loading.value = true
  try {
    await saveBudget({
      userId: authStore.user.uid,
      data: {
        categoryId: selectedCategoryId.value,
        amount: num,
        month: currentMonth.value,
        repeatType: repeatType.value,
      }
    })
    
    ElMessage.success('已保存')
    router.back()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="budget-add page-container">
    <div class="budget-add__content">
      <!-- 金额输入 -->
      <div class="amount-input">
        <span class="amount-input__symbol">¥</span>
        <input
          v-model="amount"
          type="number"
          class="amount-input__field"
          placeholder="0.00"
          min="0"
          step="100"
          @focus="handleAmountFocus"
        />
      </div>

      <!-- 分类选择 -->
      <IconCarousel
        v-model="selectedCategoryId"
        :items="categories"
        label="选择分类"
      />

      <!-- 重复类型 -->
      <div class="repeat-selector">
        <div class="repeat-selector__label">重复周期</div>
        <el-select v-model="repeatType" class="repeat-selector__select">
          <el-option
            v-for="opt in repeatOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <!-- 提交按钮 -->
      <el-button
        type="primary"
        class="submit-btn"
        :loading="loading"
        @click="handleSubmit"
      >
        保存预算
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.budget-add {
  &__content {
    padding: $spacing-lg;
  }
}

.amount-input {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $spacing-xl;

  &__symbol {
    font-size: 32px;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
    margin-right: $spacing-sm;
  }

  &__field {
    font-size: 48px;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
    border: none;
    outline: none;
    width: 200px;
    text-align: center;
    background: transparent;

    &::placeholder {
      color: $color-text-secondary;
    }
  }
}

.repeat-selector {
  margin-bottom: $spacing-xl;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-md;
  }

  &__select {
    width: 100%;
  }
}

.submit-btn {
  width: 100%;
  height: 48px;
}
</style>