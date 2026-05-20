<template>
  <el-date-picker
    ref="datePickerRef"
    v-model="internalValue"
    type="month"
    :clearable="false"
    :disabled-date="props.disabledDate"
    class="month-picker-hidden"
    @calendar-change="handleCalendarChange"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Ref } from 'vue'

const props = defineProps<{
  modelValue: string  // YYYY-MM
  disabledDate?: (date: Date) => boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 内部使用 Date 对象管理 el-date-picker
const internalValue = ref(new Date(props.modelValue + '-01'))

// 监听外部 modelValue 变化，更新内部值
watch(() => props.modelValue, (newVal) => {
  const newDate = new Date(newVal + '-01')
  if (newDate.getTime() !== internalValue.value.getTime()) {
    internalValue.value = newDate
  }
})

// 监听内部值变化，转换为 YYYY-MM 格式
watch(internalValue, (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const newMonth = `${y}-${m}`
  if (newMonth !== props.modelValue) {
    emit('update:modelValue', newMonth)
  }
})

// 日历变化时同步到外部
function handleCalendarChange(date: Date | null) {
  if (date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    emit('update:modelValue', `${y}-${m}`)
  }
}

// 暴露 open 方法，供外部调用打开日期选择器
defineExpose({
  open: () => {
    // 使用 requestAnimationFrame 延迟到下一帧，
    // 避免触发按钮的 click 事件冒泡被 onClickOutside 捕获后立即关闭弹窗
    requestAnimationFrame(() => {
      const picker = datePickerRef.value
      if (picker) {
        if (typeof picker.handleOpen === 'function') {
          picker.handleOpen()
        } else {
          const el = picker.$el || picker
          if (el && el.querySelector) {
            const input = el.querySelector('.el-input__wrapper') as HTMLElement
            if (input) {
              input.click()
            }
          }
        }
      }
    })
  },
})

const datePickerRef: Ref<any> = ref(null)
</script>

<style lang="scss" scoped>
.month-picker-hidden {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>

<style lang="scss">
// 非 scoped：覆盖 Element Plus date-picker 样式
.month-picker-hidden.el-date-editor {
  position: absolute !important;
  top: 0 !important;
  right: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;

  .el-input__wrapper {
    display: none !important;
  }
}
</style>