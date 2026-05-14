<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface IconItem {
  id: string
  name: string
  icon: string
  disabled?: boolean
}

interface Props {
  items: IconItem[]
  modelValue: string | string[]
  label?: string
  columns?: number
  rows?: number
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  columns: 4,
  rows: 3,
  multiple: false,
})

const emit = defineEmits<{
  'update:modelValue': [id: string | string[]]
}>()

const pageSize = computed(() => props.columns * props.rows)

const pages = computed(() => {
  const result: IconItem[][] = []
  for (let i = 0; i < props.items.length; i += pageSize.value) {
    result.push(props.items.slice(i, i + pageSize.value))
  }
  return result
})

// 判断是否选中（兼容单选和多选模式）
const isSelected = (id: string): boolean => {
  if (props.multiple) {
    const values = props.modelValue as string[]
    return values.includes(id)
  }
  return props.modelValue === id
}

const selectedPage = computed(() => {
  if (props.multiple) {
    const values = props.modelValue as string[]
    if (values.length === 0) return 0
    const idx = props.items.findIndex(item => item.id === values[0])
    return idx >= 0 ? Math.floor(idx / pageSize.value) : 0
  }
  const idx = props.items.findIndex(item => item.id === props.modelValue)
  return idx >= 0 ? Math.floor(idx / pageSize.value) : 0
})

const carouselRef = ref<any>(null)

watch(selectedPage, (page) => {
  carouselRef.value?.setActiveItem(page)
})

function handleSelect(item: IconItem) {
  if (item.disabled) return
  
  if (props.multiple) {
    const values = [...(props.modelValue as string[])]
    const index = values.indexOf(item.id)
    if (index > -1) {
      // 已选中，取消选择
      values.splice(index, 1)
    } else {
      // 未选中，添加选择
      values.push(item.id)
    }
    emit('update:modelValue', values)
  } else {
    emit('update:modelValue', item.id)
  }
}
</script>

<template>
  <div class="icon-carousel">
    <div v-if="label" class="icon-carousel__header">
      <span class="icon-carousel__label">{{ label }}</span>
    </div>
    
    <el-carousel
      ref="carouselRef"
      :autoplay="false"
      :loop="false"
      indicator-position="outside"
      height="280px"
    >
      <el-carousel-item v-for="(page, pageIndex) in pages" :key="pageIndex">
        <div
          class="icon-carousel__grid"
          :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }"
        >
          <button
            v-for="item in page"
            :key="item.id"
            class="icon-carousel__item"
            :class="{
              active: isSelected(item.id),
              disabled: item.disabled,
            }"
            @click="handleSelect(item)"
          >
            <span class="icon-carousel__icon">{{ item.icon }}</span>
            <span class="icon-carousel__name">{{ item.name }}</span>
          </button>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.icon-carousel {
  margin-bottom: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__grid {
    display: grid;
    gap: $spacing-md;
    padding: $spacing-sm;
    height: 100%;
    align-content: start;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $spacing-md $spacing-xs;
    background: $color-bg;
    border-radius: $radius-lg;
    border: 2px solid transparent;
    transition: all 0.2s;
    filter: grayscale(100%);
    opacity: 0.6;

    &.active {
      border-color: $color-primary;
      background: rgba($color-primary, 0.05);
      filter: none;
      opacity: 1;
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__icon {
    font-size: 24px;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-xs;
    color: $color-text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}
</style>