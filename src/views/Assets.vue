<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, TrendCharts } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { createAssetAccount, getAssetAccounts, updateAssetAccount, deleteAssetAccount } from '@/services/asset'
import { getPreviousMonthSnapshot } from '@/services/assetSnapshot'
import AssetSummaryCard from '@/components/AssetSummaryCard.vue'
import AssetAccountList from '@/components/AssetAccountList.vue'
import AssetAccountForm from '@/components/AssetAccountForm.vue'
import AssetEditForm from '@/components/AssetEditForm.vue'
import type { AssetAccount, AssetAccountData } from '@/types/asset'

const router = useRouter()
const authStore = useAuthStore()
const accounts = ref<AssetAccount[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingAccount = ref<AssetAccount | null>(null)
const showAmounts = ref(true)
const previousNetAssets = ref<number | null>(null)

// 从 localStorage 读取显隐状态
const savedVisibility = localStorage.getItem('assetShowAmounts')
if (savedVisibility !== null) {
  showAmounts.value = savedVisibility === 'true'
}

function toggleVisibility() {
  showAmounts.value = !showAmounts.value
  localStorage.setItem('assetShowAmounts', String(showAmounts.value))
}

async function loadAccounts() {
  if (!authStore.user) return
  
  loading.value = true
  try {
    accounts.value = await getAssetAccounts(authStore.user.uid)
    
    // 获取上月快照
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const previousSnapshot = await getPreviousMonthSnapshot({
      userId: authStore.user.uid,
      currentMonth
    })
    previousNetAssets.value = previousSnapshot?.netAssets ?? null
  } catch (error) {
    console.error('Failed to load asset accounts:', error)
  } finally {
    loading.value = false
  }
}

async function handleCreateAccount(data: AssetAccountData) {
  if (!authStore.user) return
  
  try {
    await createAssetAccount({
      userId: authStore.user.uid,
      data
    })
    showForm.value = false
    ElMessage.success('账户已添加')
    await loadAccounts()
  } catch (error) {
    console.error('Failed to create asset account:', error)
    ElMessage.error('添加失败')
  }
}

function handleEditAccount(account: AssetAccount) {
  editingAccount.value = account
}

async function handleUpdateAccount(data: AssetAccountData) {
  if (!authStore.user || !editingAccount.value) return
  
  try {
    await updateAssetAccount({
      userId: authStore.user.uid,
      accountId: editingAccount.value.id,
      data
    })
    editingAccount.value = null
    ElMessage.success('账户已更新')
    await loadAccounts()
  } catch (error) {
    console.error('Failed to update asset account:', error)
    ElMessage.error('更新失败')
  }
}

async function handleDeleteAccount() {
  if (!authStore.user || !editingAccount.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定删除账户「${editingAccount.value.name}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteAssetAccount({
      userId: authStore.user.uid,
      accountId: editingAccount.value.id
    })
    editingAccount.value = null
    ElMessage.success('账户已删除')
    await loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete asset account:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(loadAccounts)
</script>

<template>
  <div class="assets page-container">
    <!-- 添加账户表单（弹窗式） -->
    <div v-if="showForm" class="assets__form-overlay">
      <div class="assets__form-container">
        <AssetAccountForm 
          @submit="handleCreateAccount"
          @cancel="showForm = false"
        />
      </div>
    </div>
    
    <!-- 编辑账户表单（弹窗式） -->
    <div v-else-if="editingAccount" class="assets__form-overlay">
      <div class="assets__form-container">
        <AssetEditForm 
          :account="editingAccount"
          @submit="handleUpdateAccount"
          @delete="handleDeleteAccount"
          @cancel="editingAccount = null"
        />
      </div>
    </div>
    
    <template v-else>
      <!-- A区：净资产卡片 -->
      <AssetSummaryCard 
        :accounts="accounts" 
        :show-amounts="showAmounts"
        :previous-net-assets="previousNetAssets"
        @toggle-visibility="toggleVisibility"
      />
      
      <!-- 趋势入口 -->
      <div class="assets__trends-link" @click="router.push('/assets/trends')">
        <el-icon><TrendCharts /></el-icon>
        <span>查看资产趋势</span>
        <span class="assets__trends-arrow">›</span>
      </div>
      
      <!-- B区：账户列表 -->
      <div class="assets__list-section">
        <div class="assets__list-header">
          <h3>资产账户</h3>
          <button class="add-btn" @click="showForm = true">
            <el-icon><Plus /></el-icon>
          </button>
        </div>
        <AssetAccountList 
          :accounts="accounts" 
          :loading="loading" 
          :show-amounts="showAmounts"
          @edit="handleEditAccount"
        />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.assets {
  padding-bottom: $spacing-xl;
  position: relative;

  &__form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $color-bg;
    z-index: 100;
    overflow-y: auto;
  }

  &__form-container {
    max-width: 100%;
    min-height: 100%;
  }

  &__list-section {
    // B区样式
  }

  &__list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: $color-text-primary;
    }
  }
}

.assets__trends-link {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-lg;
  background: $color-bg;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: background 0.2s;
  color: $color-primary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;

  &:active {
    background: #f0f0f0;
  }
}

.assets__trends-arrow {
  margin-left: auto;
  font-size: 18px;
  color: $color-text-secondary;
}

.add-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  background: $color-primary;
  color: white;
  border: none;
  border-radius: $radius-full;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: darken($color-primary, 10%);
  }

  &:active {
    background: darken($color-primary, 20%);
  }
}
</style>