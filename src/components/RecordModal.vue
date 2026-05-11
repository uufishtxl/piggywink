<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElDialog, ElButton, ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { parseExpense, matchCategory, saveExpenses } from '@/services/expense'

interface EditableItem {
  amount: number
  description: string
  categoryName: string
  categoryId: string
  date: Date
  editingField: 'amount' | 'description' | null
  editValue: string
}

// 模板 ref 用于自动 focus
const amountInputRef = ref<any[]>([])
const descInputRef = ref<any[]>([])

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const inputText = ref('')
const loading = ref(false)
const editableItems = ref<EditableItem[]>([])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const totalAmount = computed(() =>
  editableItems.value.reduce((sum, item) => sum + item.amount, 0)
)

// 解析输入
async function handleParse() {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入支出内容')
    return
  }
  
  loading.value = true
  try {
    const categoryNames = categoriesStore.categories.map(c => c.name)
    const parsed = await parseExpense(inputText.value.trim(), categoryNames)
    
    // 转换为可编辑格式
    editableItems.value = parsed.map(item => ({
      amount: item.amount,
      description: item.description,
      categoryName: item.categoryName,
      categoryId: matchCategory(item.categoryName, categoriesStore.categories),
      date: item.date,
      editingField: null,
      editValue: '',
    }))
  } catch (e) {
    ElMessage.error('解析失败')
  } finally {
    loading.value = false
  }
}

// 开始编辑字段
function startEdit(index: number, field: 'amount' | 'description') {
  const item = editableItems.value[index]
  item.editingField = field
  item.editValue = field === 'amount' ? String(item.amount) : item.description
  
  // 自动 focus
  nextTick(() => {
    if (field === 'amount') {
      // el-input-number 需要访问内部 input
      const el = amountInputRef.value[index]
      if (el?.focus) {
        el.focus()
      } else if (el?.$el) {
        el.$el.querySelector('input')?.focus()
      }
    } else {
      const el = descInputRef.value[index]
      if (el?.focus) {
        el.focus()
      } else if (el?.$el) {
        el.$el.querySelector('input')?.focus()
      }
    }
  })
}

// 确认编辑
function confirmEdit(index: number) {
  const item = editableItems.value[index]
  if (item.editingField === 'amount') {
    const num = parseFloat(item.editValue)
    if (!isNaN(num) && num > 0) {
      item.amount = num
    }
  } else if (item.editingField === 'description') {
    if (item.editValue.trim()) {
      item.description = item.editValue.trim()
    }
  }
  item.editingField = null
  item.editValue = ''
}

// 分类变更
function handleCategoryChange(index: number, categoryId: string) {
  const item = editableItems.value[index]
  item.categoryId = categoryId
  const cat = categoriesStore.categories.find(c => c.id === categoryId)
  if (cat) {
    item.categoryName = cat.name
  }
}

// 确认保存
async function handleSave() {
  if (!editableItems.value.length || !authStore.user) return
  
  loading.value = true
  try {
    const items = editableItems.value.map(item => ({
      amount: item.amount,
      description: item.description,
      categoryId: item.categoryId,
      date: item.date,
    }))
    
    await saveExpenses({
      userId: authStore.user.uid,
      items,
    })
    
    ElMessage.success(`已保存 ${items.length} 笔`)
    inputText.value = ''
    editableItems.value = []
    dialogVisible.value = false
    emit('saved')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 重新输入
function handleReset() {
  editableItems.value = []
  inputText.value = ''
}

function handleClose() {
  editableItems.value = []
  inputText.value = ''
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="记一笔"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="record-form">
      <!-- 未解析状态：输入框 -->
      <div v-if="!editableItems.length" class="record-form__input">
        <textarea
          v-model="inputText"
          class="record-textarea"
          placeholder="说点什么... 如：午餐星巴克48元"
          rows="3"
          @keydown.enter.prevent="handleParse"
        />
        <ElButton
          type="primary"
          class="record-submit"
          :loading="loading"
          @click="handleParse"
        >
          解析
        </ElButton>
      </div>

      <!-- 解析结果预览 -->
      <div v-else class="record-form__preview">
        <div class="preview-list">
          <div
            v-for="(item, index) in editableItems"
            :key="index"
            class="preview-card"
          >
            <!-- 分类 -->
            <div class="preview-item">
              <span class="preview-label">分类</span>
              <el-select
                :model-value="item.categoryId"
                size="small"
                class="category-select"
                @update:model-value="handleCategoryChange(index, $event)"
              >
                <el-option
                  v-for="cat in categoriesStore.categories"
                  :key="cat.id"
                  :label="`${cat.icon} ${cat.name}`"
                  :value="cat.id"
                />
              </el-select>
            </div>
            
            <!-- 金额 -->
            <div class="preview-item">
              <span class="preview-label">金额</span>
              <div class="preview-value">
                <template v-if="item.editingField === 'amount'">
                  <el-input-number
                    :ref="(el: any) => { if (el) amountInputRef[index] = el }"
                    v-model="item.amount"
                    :min="0"
                    :precision="2"
                    size="small"
                    @blur="item.editingField = null"
                    @keyup.enter="item.editingField = null"
                  />
                </template>
                <template v-else>
                  <span class="editable" @click="startEdit(index, 'amount')">
                    ¥{{ item.amount.toFixed(2) }}
                  </span>
                </template>
              </div>
            </div>
            
            <!-- 描述 -->
            <div class="preview-item">
              <span class="preview-label">描述</span>
              <div class="preview-value">
                <template v-if="item.editingField === 'description'">
                  <el-input
                    :ref="(el: any) => { if (el) descInputRef[index] = el }"
                    v-model="item.editValue"
                    size="small"
                    @blur="confirmEdit(index)"
                    @keyup.enter="confirmEdit(index)"
                  />
                </template>
                <template v-else>
                  <span class="editable" @click="startEdit(index, 'description')">
                    {{ item.description }}
                  </span>
                </template>
              </div>
            </div>
            
            <!-- 日期 -->
            <div class="preview-item">
              <span class="preview-label">日期</span>
              <el-date-picker
                v-model="item.date"
                type="date"
                format="YYYY-MM-DD"
                size="small"
                class="date-picker"
              />
            </div>
          </div>
        </div>

        <div v-if="editableItems.length > 1" class="preview-total">
          <span>共 {{ editableItems.length }} 笔</span>
          <span>合计 ¥{{ totalAmount.toFixed(2) }}</span>
        </div>

        <div class="preview-actions">
          <ElButton @click="handleReset">重输</ElButton>
          <ElButton type="primary" :loading="loading" @click="handleSave">
            确认保存
          </ElButton>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.record-form {
  &__input {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__preview {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }
}

.record-textarea {
  width: 100%;
  padding: $spacing-md;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  font-size: $font-size-md;
  font-family: inherit;
  resize: none;
  
  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.record-submit {
  width: 100%;
  height: 44px;
  background: $color-primary;
  border-color: $color-primary;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.preview-card {
  background: $color-bg-gray;
  border-radius: $radius-lg;
  padding: $spacing-md;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid $color-border;
  }
}

.preview-label {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  flex-shrink: 0;
  margin-right: $spacing-sm;
}

.preview-value {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  text-align: right;
}

.category-select {
  width: 140px;
}

.date-picker {
  width: 140px;
}

.editable {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    background: rgba(0, 0, 0, 0.1);
  }
}

.preview-total {
  display: flex;
  justify-content: space-between;
  padding: $spacing-md;
  background: rgba($color-primary, 0.1);
  border-radius: $radius-md;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-primary;
}

.preview-actions {
  display: flex;
  gap: $spacing-md;
  
  .el-button {
    flex: 1;
    height: 44px;
  }
}
</style>
