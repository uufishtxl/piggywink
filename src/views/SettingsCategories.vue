<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElButton, ElDialog, ElInput, ElSwitch, ElMessage, ElMessageBox } from 'element-plus'
import { useCategoriesStore } from '@/stores/categories'
import type { Category } from '@/types/category'

const categoriesStore = useCategoriesStore()

const dialogVisible = ref(false)
const editingCategory = ref<Category | null>(null)
const formName = ref('')
const formIcon = ref('')
const formIsSafe = ref(false)

// 滑动状态：记录哪个 item 正在显示删除按钮
const swipedId = ref<string | null>(null)
let touchStartX = 0
let touchStartY = 0
let swiping = false

let unsubscribe: (() => void) | null = null

function handleOpenAdd() {
  openAddDialog()
}

onMounted(async () => {
  await categoriesStore.initPresetCategories()
  unsubscribe = categoriesStore.subscribeToCategories()
  window.addEventListener('open-add-category', handleOpenAdd)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  window.removeEventListener('open-add-category', handleOpenAdd)
})

// 触摸开始
function onTouchStart(id: string, e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  swiping = false
  // 如果点击的不是当前已滑开的 item，先关闭
  if (swipedId.value && swipedId.value !== id) {
    swipedId.value = null
  }
}

// 触摸移动：判断是否左滑
function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  // 水平滑动距离 > 垂直滑动，且是左滑
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
    swiping = true
  }
}

// 触摸结束
function onTouchEnd(id: string, e: TouchEvent) {
  if (!swiping) return
  const dx = e.changedTouches[0].clientX - touchStartX
  // 左滑超过 40px → 显示删除
  if (dx < -40) {
    swipedId.value = id
  } else if (dx > 40) {
    // 右滑 → 关闭
    swipedId.value = null
  }
  swiping = false
}

// 点击空白处关闭
function closeSwipe() {
  swipedId.value = null
}

function openAddDialog() {
  editingCategory.value = null
  formName.value = ''
  formIcon.value = ''
  formIsSafe.value = false
  dialogVisible.value = true
}

function openEditDialog(category: Category) {
  editingCategory.value = category
  formName.value = category.name
  formIcon.value = category.icon
  formIsSafe.value = category.isSafe
  dialogVisible.value = true
}

async function handleSave() {
  if (!formName.value.trim() || !formIcon.value.trim()) {
    ElMessage.warning('请填写名称和图标')
    return
  }
  try {
    if (editingCategory.value) {
      await categoriesStore.updateCategory(editingCategory.value.id, {
        name: formName.value.trim(),
        icon: formIcon.value.trim(),
        isSafe: formIsSafe.value
      })
      ElMessage.success('已更新')
    } else {
      await categoriesStore.addCategory({
        name: formName.value.trim(),
        icon: formIcon.value.trim(),
        isSafe: formIsSafe.value,
        isSystem: false
      })
      ElMessage.success('已添加')
    }
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  }
}

async function toggleSafe(category: Category) {
  try {
    await categoriesStore.updateCategory(category.id, { isSafe: !category.isSafe })
  } catch {
    ElMessage.error('修改失败')
  }
}

async function handleDelete(category: Category) {
  if (category.isSystem) return
  try {
    await ElMessageBox.confirm(`确定删除「${category.name}」？`, '删除确认', { type: 'warning' })
    await categoriesStore.deleteCategory(category.id)
    swipedId.value = null
    ElMessage.success('已删除')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}
</script>

<template>
  <div class="categories page-container">
    <div class="category-list" @click="closeSwipe">
      <div
        v-for="cat in categoriesStore.categories"
        :key="cat.id"
        class="category-item"
        @click="openEditDialog(cat)"
        @touchstart="onTouchStart(cat.id, $event)"
        @touchmove="onTouchMove($event)"
        @touchend="onTouchEnd(cat.id, $event)"
      >
        <div class="category-item__icon">{{ cat.icon }}</div>
        <div class="category-item__info">
          <div class="category-item__name">
            {{ cat.name }}
            <span v-if="cat.isSystem" class="badge badge--system">系统</span>
            <span v-if="cat.isSafe" class="badge badge--safe">常规</span>
          </div>
        </div>
        <div class="category-item__actions">
          <ElSwitch
            :model-value="cat.isSafe"
            size="small"
            @click.stop
            @change="toggleSafe(cat)"
          />
        </div>

        <!-- 左滑露出的删除按钮 -->
        <div
          v-if="!cat.isSystem"
          class="category-item__delete-zone"
          :class="{ 'category-item__delete-zone--show': swipedId === cat.id }"
        >
          <button class="btn-delete" @click.stop="handleDelete(cat)">删除</button>
        </div>
      </div>
    </div>

    <div class="add-btn-wrapper">
      <ElButton type="primary" class="add-btn" @click="openAddDialog">
        + 添加分类
      </ElButton>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="editingCategory ? '编辑分类' : '添加分类'"
      width="90%"
      :close-on-click-modal="false"
    >
      <div class="form">
        <div class="form-item">
          <label>图标</label>
          <ElInput v-model="formIcon" placeholder="如 🍜" maxlength="2" />
        </div>
        <div class="form-item">
          <label>名称</label>
          <ElInput v-model="formName" placeholder="分类名称" maxlength="20" />
        </div>
        <div class="form-item form-item--switch">
          <label>常规类别</label>
          <ElSwitch v-model="formIsSafe" />
          <span class="form-item__hint">常规类别始终计入统计，非常规类别可手动排除</span>
        </div>
      </div>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.category-list {
  padding: $spacing-md $spacing-lg;
  overflow: hidden;
}

.category-item {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: $spacing-sm;
  border-radius: $radius-lg;
  overflow: hidden;
  background: $color-bg;

  &:active {
    background: $color-bg-gray;
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
    padding: $spacing-md $spacing-sm;
  }

  &__name {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-primary;
    white-space: nowrap;
  }

  &__actions {
    flex-shrink: 0;
    padding-right: $spacing-md;
  }

  // 左滑删除区域
  &__delete-zone {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(100%);
    transition: transform 0.25s ease;

    &--show {
      transform: translateX(0);
    }
  }
}

.badge {
  font-size: 11px;
  padding: 0 5px;
  border-radius: $radius-sm;
  white-space: nowrap;

  &--system {
    color: $color-text-placeholder;
    background: $color-bg-gray;
  }

  &--safe {
    color: $color-primary;
    background: rgba($color-primary, 0.1);
  }
}

.btn-delete {
  width: 100%;
  height: 100%;
  background: #EF4444;
  color: white;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  border: none;
  cursor: pointer;
}

.add-btn-wrapper {
  padding: $spacing-lg;
}

.add-btn {
  width: 100%;
  background: $color-primary;
  border-color: $color-primary;
}

.form {
  &-item {
    margin-bottom: $spacing-lg;

    label {
      display: block;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-sm;
      color: $color-text-primary;
    }

    &--switch {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .form-item__hint {
        font-size: $font-size-xs;
        color: $color-text-secondary;
      }
    }
  }
}
</style>