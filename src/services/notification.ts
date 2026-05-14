import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { NotificationPreference } from '@/types/notification'

const DEFAULT_PREFERENCE: NotificationPreference = {
  pushEnabled: true,
  preference: 'failure_only',
  inAppEnabled: true,
}

// 获取用户通知偏好
export async function getNotificationPreference(userId: string): Promise<NotificationPreference> {
  const prefRef = doc(db, 'users', userId, 'notificationPreferences', 'settings')
  const snapshot = await getDoc(prefRef)

  if (!snapshot.exists()) {
    // 文档不存在时，创建文档并返回默认值
    await setDoc(prefRef, DEFAULT_PREFERENCE)
    return DEFAULT_PREFERENCE
  }

  const data = snapshot.data()
  return {
    pushEnabled: data.pushEnabled ?? DEFAULT_PREFERENCE.pushEnabled,
    preference: data.preference ?? DEFAULT_PREFERENCE.preference,
    inAppEnabled: data.inAppEnabled ?? DEFAULT_PREFERENCE.inAppEnabled,
  }
}
