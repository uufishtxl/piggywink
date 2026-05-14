<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { updateExpense, deleteExpense, getExpenseById } from '@/services/expense'
import IconCarousel from '@/components/IconCarousel.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const amount = ref<number | string>(0)
const description = ref('')
const selectedCategoryId = ref('')
const selectedDate = ref('')
const loading = ref(false)

const expenseId = computed(() => route.params.id as string)

// 从 Firestore 获取支出数据
onMounted(async () => {
  if (!authStore.user) return
  
  loading.value = true
  try {
    const expense = await getExpenseById(authStore.user.uid, expenseId.value)
    if (expense) {
      amount.value = expense.amount
      description.value = expense.description
      selectedCategoryId.value = expense.categoryId
      selectedDate.value = expense.date.toISOString().slice(0, 10)
    } else {
      ElMessage.warning('未找到支出数据')
      router.back()
    }
  } catch (e) {
    ElMessage.error('加载失败')
    router.back()
  } finally {
    loading.value = false
  }
})

const categories = computed(() => 
  categoriesStore.categories.map(c => ({ ...c, disabled: false }))
)

function handleAmountFocus() {
  if (amount.value === 0) {
    amount.value = ''
  }
}

async function handleSave() {
  if (!selectedCategoryId.value) {
    ElMessage.warning('请选择分类')
    return
  }
  
  const num = Number(amount.value)
  if (!num || num <= 0) {
    ElMessage.warning('请输入有效金额')
    return
  }
  
  if (!description.value.trim()) {
    ElMessage.warning('请输入描述')
    return
  }
  
  if (!authStore.user) return
  
  loading.value = true
  try {
    await updateExpense(authStore.user.uid, expenseId.value, {
      categoryId: selectedCategoryId.value,
      amount: num,
      description: description.value.trim(),
      date: new Date(selectedDate.value),
    })
    ElMessage.success('已更新')
    router.back()
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!authStore.user) return
  
  try {
    await ElMessageBox.confirm('确定删除这条支出？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    await deleteExpense(authStore.user.uid, expenseId.value)
    ElMessage.success('已删除')
    router.back()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<template>
  <div class="expense-edit page-container">
    <div class="expense-edit__content">
      <!-- 金额输入 -->
      <div class="amount-input">
        <span class="amount-input__symbol">¥</span>
        <input
          v-model="amount"
          type="number"
          class="amount-input__field"
          placeholder="0.00"
          min="0"
          step="1"
          @focus="handleAmountFocus"
        />
      </div>

      <!-- 分类选择 -->
      <IconCarousel
        v-model="selectedCategoryId"
        :items="categories"
        label="选择分类"
      />

      <!-- 描述 -->
      <div class="form-group">
        <div class="form-group__label">描述</div>
        <el-input v-model="description" placeholder="输入支出描述" />
      </div>

      <!-- 日期 -->
      <div class="form-group">
        <div class="form-group__label">日期</div>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button
          type="primary"
          class="actions__save"
          :loading="loading"
          @click="handleSave"
        >
          保存修改
        </el-button>
        <el-button
          type="danger"
          plain
          class="actions__delete"
          @click="handleDelete"
        >
          删除支出
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.expense-edit {
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

.form-group {
  margin-bottom: $spacing-lg;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-sm;
  }
}

.actions {
  margin-top: $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__save,
  &__delete {
    width: 100%;
    height: 48px;
    margin-left: 0;
  }
}
</style>