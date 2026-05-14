// Global test setup for element-plus components
import { config } from '@vue/test-utils'
import { ElIcon, ElButton, ElInput, ElSelect, ElOption, ElSwitch, ElSlider, ElDatePicker } from 'element-plus'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

// Register element-plus components globally
config.global.components = {
  ElIcon,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElSwitch,
  ElSlider,
  ElDatePicker,
  ArrowUp,
  ArrowDown,
  Minus,
}