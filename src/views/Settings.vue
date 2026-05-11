<template>
  <div class="settings page-container">
    <header class="page-header">
      <button class="page-header__back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <span class="page-header__title">设置</span>
      <div class="page-header__action"></div>
    </header>
    
    <div class="settings-list">
      <router-link to="/settings/categories" class="settings-item">
        <el-icon class="settings-item__icon"><Folder /></el-icon>
        <span class="settings-item__label">分类管理</span>
        <el-icon class="settings-item__arrow"><ArrowRight /></el-icon>
      </router-link>
      
      <router-link to="/budgets" class="settings-item">
        <el-icon class="settings-item__icon"><Wallet /></el-icon>
        <span class="settings-item__label">预算设置</span>
        <el-icon class="settings-item__arrow"><ArrowRight /></el-icon>
      </router-link>
      
      <router-link to="/settings/notifications" class="settings-item">
        <el-icon class="settings-item__icon"><Bell /></el-icon>
        <span class="settings-item__label">通知设置</span>
        <el-icon class="settings-item__arrow"><ArrowRight /></el-icon>
      </router-link>
    </div>
    
    <div class="settings-account">
      <div class="account-info">
        <img v-if="authStore.photoURL" :src="authStore.photoURL" class="account-info__avatar" />
        <div v-else class="account-info__avatar account-info__avatar--placeholder">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <span class="account-info__name">{{ authStore.displayName }}</span>
      </div>
      <button class="btn-logout" @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Folder, Wallet, Bell, User, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

function goBack() {
  router.back()
}

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.settings {
  &-list {
    margin-top: $spacing-md;
  }
  
  &-item {
    @include flex-between;
    padding: $spacing-lg;
    background: $color-bg;
    border-bottom: 1px solid $color-border;
    
    &:first-child {
      border-top: 1px solid $color-border;
    }
    
    &__icon {
      font-size: 20px;
      margin-right: $spacing-md;
    }
    
    &__label {
      flex: 1;
      font-size: $font-size-sm;
    }
    
    &__arrow {
      color: $color-text-placeholder;
    }
    
    &:active {
      background: $color-bg-gray;
    }
  }
  
  &-account {
    margin-top: $spacing-xl;
    padding: $spacing-lg;
  }
}

.account-info {
  @include flex-center;
  flex-direction: column;
  margin-bottom: $spacing-lg;
  
  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: $radius-full;
    margin-bottom: $spacing-sm;
    
    &--placeholder {
      @include flex-center;
      font-size: 32px;
      background: $color-bg-gray;
    }
  }
  
  &__name {
    font-size: $font-size-md;
    font-weight: $font-weight-medium;
  }
}

.btn-logout {
  width: 100%;
  padding: $spacing-md;
  background: transparent;
  color: $color-danger;
  border: 1px solid $color-danger;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  
  &:active {
    background: rgba($color-danger, 0.1);
  }
}
</style>
