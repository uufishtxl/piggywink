<template>
  <div class="card compare-category-filter">
    <div class="compare-category-filter__header">
      <span class="compare-category-filter__title">统计类别</span>
      <span class="compare-category-filter__desc">总是包含所有的常规类别</span>
    </div>
    <button class="compare-category-filter__btn" @click="openModal">
      自定义非常规分类
    </button>

    <!-- 类别选择弹窗 -->
    <div v-if="showModal" class="compare-category-filter__modal" @click.self="cancelSelection">
      <div class="compare-category-filter__modal-content">
        <h3>选择非常规类别</h3>
        <div class="compare-category-filter__select-actions">
          <button @click="selectAll">全选</button>
          <button @click="selectNone">全不选</button>
        </div>
        <IconCarousel
          v-if="showModal"
          :items="items"
          v-model="tempSelectedIds"
          :multiple="true"
        />
        <div class="compare-category-filter__modal-actions">
          <button class="compare-category-filter__modal-confirm" @click="confirmSelection">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IconCarousel from '@/components/IconCarousel.vue'

export interface CategoryFilterItem {
  id: string
  name: string
  icon: string
  disabled: boolean
}

const props = defineProps<{
  items: CategoryFilterItem[]
  selectedIds: string[]
}>()

const emit = defineEmits<{
  'update:selectedIds': [ids: string[]]
}>()

const showModal = ref(false)
const tempSelectedIds = ref<string[]>([])

function openModal() {
  tempSelectedIds.value = [...props.selectedIds]
  showModal.value = true
}

function confirmSelection() {
  emit('update:selectedIds', [...tempSelectedIds.value])
  showModal.value = false
}

function cancelSelection() {
  showModal.value = false
}

function selectAll() {
  tempSelectedIds.value = props.items.map(item => item.id)
}

function selectNone() {
  tempSelectedIds.value = []
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.compare-category-filter {
  margin-bottom: $spacing-md;
  padding: $spacing-lg;

  &__header {
    display: flex;
    flex-direction: column;
    margin-bottom: $spacing-sm;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: $spacing-xs;
  }

  &__desc {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__btn {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid $color-primary;
    border-radius: $radius-sm;
    background: $color-primary;
    color: #fff;
    font-size: $font-size-xs;
    font-weight: 500;
    cursor: pointer;
  }

  &__modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
  }

  &__modal-content {
    background: white;
    border-radius: $radius-lg;
    padding: $spacing-md;
    width: 90%;
    max-width: 400px;

    h3 {
      margin-bottom: $spacing-sm;
      font-size: $font-size-md;
      font-weight: 600;
      text-align: left;
    }
  }

  &__select-actions {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;

    button {
      padding: $spacing-xs $spacing-sm;
      border: 1px solid $color-border;
      border-radius: $radius-sm;
      background: white;
      font-size: $font-size-xs;
      color: $color-primary;
      cursor: pointer;

      &:hover {
        background-color: $color-bg-gray;
      }
    }
  }

  &__modal-actions {
    display: flex;
    justify-content: center;
    margin-top: $spacing-md;

    button {
      padding: $spacing-sm $spacing-lg;
      border-radius: 8px;
      border: 1px solid $color-border;
      background: white;
      cursor: pointer;
      font-size: $font-size-md;

      &:hover {
        background-color: $color-bg-gray;
      }
    }
  }

  &__modal-confirm {
    flex: 1;
    background-color: $color-primary !important;
    color: white !important;
    border-color: $color-primary !important;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
