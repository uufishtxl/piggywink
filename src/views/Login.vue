<template>
  <div class="login">
    <div class="login-container">
      <div class="login-logo">🐷</div>
      <h1 class="login-title">Piggy Wink</h1>
      <p class="login-subtitle">AI 智能记账，极简生活</p>
      
      <button 
        class="login-btn" 
        :disabled="loading"
        @click="handleGoogleLogin"
      >
        <span v-if="loading">登录中...</span>
        <span v-else>使用 Google 账号登录</span>
      </button>
      
      <p v-if="error" class="login-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)

async function handleGoogleLogin() {
  loading.value = true
  error.value = null
  
  try {
    await authStore.loginWithGoogle()
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.login {
  min-height: 100vh;
  @include flex-center;
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  
  &-container {
    @include flex-center;
    flex-direction: column;
    padding: $spacing-3xl;
    text-align: center;
  }
  
  &-logo {
    font-size: 80px;
    margin-bottom: $spacing-lg;
  }
  
  &-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: white;
    margin-bottom: $spacing-sm;
  }
  
  &-subtitle {
    font-size: $font-size-sm;
    color: rgba(white, 0.8);
    margin-bottom: $spacing-3xl;
  }
  
  &-btn {
    padding: $spacing-md $spacing-2xl;
    background: white;
    color: $color-primary;
    border-radius: $radius-lg;
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    box-shadow: $shadow-lg;
    
    &:active {
      transform: scale(0.98);
    }
    
    &:disabled {
      opacity: 0.7;
    }
  }
  
  &-error {
    margin-top: $spacing-md;
    font-size: $font-size-sm;
    color: rgba(white, 0.9);
  }
}
</style>
