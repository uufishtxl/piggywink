<template>
  <div class="notifications-settings page-container">
    <div class="settings-section">
      <div class="setting-item">
        <span class="setting-item__label">推送通知</span>
        <el-switch v-model="pushEnabled" @change="savePushEnabled" />
      </div>
      
      <div class="setting-item">
        <span class="setting-item__label">通知偏好</span>
        <el-radio-group v-model="preference" @change="savePreference">
          <el-radio value="failure_only">仅失败</el-radio>
          <el-radio value="all">全部</el-radio>
        </el-radio-group>
      </div>
      
      <div class="setting-item">
        <span class="setting-item__label">内置通知</span>
        <el-switch v-model="inAppEnabled" @change="saveInAppEnabled" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getNotificationPreference } from '@/services/notification'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

const authStore = useAuthStore()

const pushEnabled = ref(true)
const preference = ref<'failure_only' | 'all'>('failure_only')
const inAppEnabled = ref(true)

onMounted(async () => {
  const pref = await getNotificationPreference(authStore.user!.uid)
  pushEnabled.value = pref.pushEnabled
  preference.value = pref.preference
  inAppEnabled.value = pref.inAppEnabled
})

function getPrefRef() {
  return doc(db, 'users', authStore.user!.uid, 'notificationPreferences', 'settings')
}

async function savePushEnabled() {
  await setDoc(getPrefRef(), { pushEnabled: pushEnabled.value }, { merge: true })
}

async function savePreference() {
  await setDoc(getPrefRef(), { preference: preference.value }, { merge: true })
}

async function saveInAppEnabled() {
  await setDoc(getPrefRef(), { inAppEnabled: inAppEnabled.value }, { merge: true })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.notifications-settings {
  .settings-section {
    margin-top: $spacing-md;
  }
  
  .setting-item {
    @include flex-between;
    padding: $spacing-lg;
    background: $color-bg;
    border-bottom: 1px solid $color-border;
    
    &:first-child {
      border-top: 1px solid $color-border;
    }
    
    &__label {
      font-size: $font-size-sm;
    }
  }
}
</style>
