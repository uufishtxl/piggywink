# Piggy Wink 领域术语表

## 核心概念

### 分类 (Category)

#### isSafe（常规类别）

**定义**：`isSafe` 表示"常规类别"，即月度波动不会大的支出分类。

- `isSafe: true` — 常规类别（如：餐饮、日用品、交通、水果、零食、书籍、其他、牛奶、食材）
  - 特点：每月支出相对稳定，波动较小
  - 在统计中**始终计入**，不可手动排除
  
- `isSafe: false` — 非常规类别（如：购物、娱乐、通讯、家庭、社交、旅行、医疗、学习及兴趣、礼金、水电煤、天天）
  - 特点：每月支出波动较大，可能某月有大额支出
  - 在统计中**可手动排除**，用于聚焦分析非常规支出

**注意**：不要使用"安全类别"这个称呼，应该使用"常规类别"。

#### isSystem（系统类别）

**定义**：`isSystem` 表示系统预设的分类，用户不可删除，但可以修改。

### 预算状态

预算状态基于已用比例计算：
- `safe`（安全）：已用 < 60%
- `warning`（警告）：60% ≤ 已用 ≤ 90%
- `danger`（危险）：已用 > 90%

### 通知偏好

#### NotificationPreferenceType

- `failure_only` — 仅失败通知
- `all` — 全部通知

#### 通知设置字段

- `pushEnabled` — 推送通知开关
- `preference` — 通知偏好类型
- `inAppEnabled` — 内置通知开关

## 术语使用规范

在代码、注释、UI 文案中，统一使用以下术语：

| 字段名 | 中文术语 | 英文术语 | 说明 |
|--------|---------|---------|------|
| isSafe | 常规类别 | Regular Category | 月度波动小的支出 |
| isSafe=false | 非常规类别 | Irregular Category | 月度波动大的支出 |
| isSystem | 系统类别 | System Category | 预设分类 |
| budget.status='safe' | 安全 | Safe | 预算使用率低 |
| budget.status='warning' | 警告 | Warning | 预算使用率中等 |
| budget.status='danger' | 危险 | Danger | 预算使用率高 |
