<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import IconCarousel from '@/components/IconCarousel.vue'
import { ASSET_TYPE_PRESETS, type AssetAccountData, type AssetAccountType } from '@/types/asset'

const emit = defineEmits<{
  submit: [data: AssetAccountData]
  cancel: []
}>()

const form = reactive({
  name: '',
  type: 'savings' as AssetAccountType,
  balance: 0
})

const loading = ref(false)

function handleAmountFocus() {
  if (form.balance === 0) {
    form.balance = '' as any
  }
}

async function handleSubmit() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入账户名称')
    return
  }
  
  const num = Number(form.balance)
  if (isNaN(num)) {
    ElMessage.warning('请输入有效金额')
    return
  }
  
  loading.value = true
  try {
    emit('submit', {
      name: form.name.trim(),
      type: form.type,
      balance: num
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="asset-account-form">
    <div class="asset-account-form__content">
      <!-- 金额输入 -->
      <div class="amount-input">
        <span class="amount-input__symbol">¥</span>
        <input
          v-model.number="form.balance"
          type="number"
          inputmode="decimal"
          class="amount-input__field"
          placeholder="0.00"
          min="0"
          step="100"
          @focus="handleAmountFocus"
        />
      </div>

      <!-- 账户名称 -->
      <div class="name-input">
        <div class="name-input__label">账户名称</div>
        <input
          v-model="form.name"
          type="text"
          class="name-input__field"
          placeholder="例如：招商银行储蓄卡"
        />
      </div>

      <!-- 账户类型选择 -->
      <IconCarousel
        :items="ASSET_TYPE_PRESETS.map(p => ({ id: p.type, name: p.name, icon: p.icon }))"
        v-model="form.type"
        label="选择账户类型"
      />

      <!-- 按钮组 -->
      <div class="button-group">
        <el-button
          type="primary"
          class="submit-btn"
          :loading="loading"
          @click="handleSubmit"
        >
          添加账户
        </el-button>
        
        <el-button
          class="cancel-btn"
          @click="$emit('cancel')"
        >
          取消
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.asset-account-form {
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

.name-input {
  margin-bottom: $spacing-xl;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-md;
  }

  &__field {
    width: 100%;
    padding: $spacing-md;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    font-size: $font-size-md;
    background: $color-bg;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }

    &::placeholder {
      color: $color-text-placeholder;
    }
  }
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.submit-btn,
.cancel-btn {
  width: 100%;
  height: 48px;
  margin: 0;
}
</style>