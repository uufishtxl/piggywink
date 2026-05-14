// 通知偏好类型
export type NotificationPreferenceType = 'failure_only' | 'all'

// 通知偏好数据结构
export interface NotificationPreference {
  pushEnabled: boolean
  preference: NotificationPreferenceType
  inAppEnabled: boolean
}
