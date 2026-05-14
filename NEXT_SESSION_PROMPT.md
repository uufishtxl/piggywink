# 对比统计功能开发 - 新Session启动Prompt

## 项目背景

Piggy Wink是一个PWA记账App，使用Vue 3 + TypeScript + Firebase + Element Plus。

## 任务目标

按照依赖关系，使用project-scoped subagent并行开发对比统计功能的8个垂直切片。

## 依赖关系图

```
无依赖（可并行）: #54, #55
        ↓
依赖#54（可并行）: #56, #57, #58, #59
        ↓
依赖#56: #61
依赖#57+#58: #60
```

## 已完成工作

### ✅ #54 切片1：月份选择器 + 预聚合数据加载
- 创建 `src/services/monthlyStats.ts` (含getMonthlyStats, saveMonthlyStats, updateMonthlyStats)
- 创建 `src/services/__tests__/monthlyStats.test.ts` (3个测试通过)
- 创建 `src/views/StatsCompare.vue` (骨架+月份选择器+路由)
- 创建 `src/views/__tests__/StatsCompare.test.ts` (6个测试通过)
- 修改 `src/router/index.ts` (添加/stats/compare路由)

### ✅ #55 切片7：支出元数据维护
- 创建 `src/services/expenseMeta.ts` (含getExpenseMeta, updateExpenseMeta, recalculateExpenseMeta)
- 创建 `src/services/__tests__/expenseMeta.test.ts` (9个测试通过)
- 修改 `src/services/expense.ts` (在saveExpense/updateExpense/deleteExpense后调用updateExpenseMeta)

### ✅ #56 切片2：总支出对比显示 (后端完成)
- 创建 `src/services/statsCompare.ts` (含getCompareData, getTop3Categories, formatAmount, formatChangePercent)
- 创建 `src/services/__tests__/statsCompare.test.ts` (10个测试通过)
- 修改 `src/services/chartConfig.ts` (添加buildBarChartConfig水平柱状图配置)

### ✅ #57 切片3：TOP3柱状图 (前端完成)
- 修改 `src/views/StatsCompare.vue` (添加Bar组件和TOP3柱状图)

### ✅ #58 切片4：分类明细表格 (前端完成)
- 修改 `src/views/StatsCompare.vue` (添加分类明细表格+分页功能)

### ✅ #59 切片6：预聚合数据写入
- 修改 `src/services/expense.ts` (在saveExpense/updateExpense/deleteExpense后调用updateMonthlyStats)

## 待完成工作

### ❌ #60 切片5：类别选择器过滤
**依赖**: #57, #58 (已完成)
**需要实现**:
- 在StatsCompare.vue添加A区域：类别选择器
- 显示已选类别标签（最多3个+N）
- 点击打开底部弹窗
- 弹窗中显示所有非常规类别（图标+名称）
- 选中类别彩色，未选中黑白
- 默认选中所有非常规类别
- 点击"确定"应用选择
- 点击弹窗外取消，恢复上次状态
- 选择器变化影响图表和表格（但不影响总支出）
- 修改statsCompare.ts的getCompareData支持过滤

### ❌ #61 切片8：Stats.vue入口
**依赖**: #56 (已完成)
**需要实现**:
- 修改 `src/views/Stats.vue`
- 移除筛选图标按钮（stats__filter-btn）
- 移除筛选Toast弹窗（stats__filter-toast）
- 移除相关的响应式数据和函数
- 在SpendingSummaryCard下方添加"查看对比统计结果 →"按钮
- 点击按钮导航到/stats/compare

## 工作模式

### 使用Project-Scoped Subagent

每个issue使用独立的subagents执行（有worker/scout/planner/reviewer）。

### TDD流程 (Ralph Loop)

每个切片严格遵循：
1. **RED**: 写一个失败的测试
2. **GREEN**: 写最少代码让测试通过
3. **REFACTOR**: 提炼代码，保持测试绿色
4. 一个测试 → 一个实现 → 重复

### 垂直切片原则

每个切片必须端到端贯穿所有层（数据服务+UI组件+测试），完成后可独立演示验证。

## 关键文件结构

```
src/
├── services/
│   ├── monthlyStats.ts      # ✅ 月度预聚合数据服务
│   ├── expenseMeta.ts       # ✅ 支出元数据服务
│   ├── statsCompare.ts      # ✅ 对比数据查询服务
│   ├── expense.ts           # ✅ 已修改：添加元数据和预聚合更新
│   ├── budget.ts            # 预算服务
│   ├── chartConfig.ts       # ✅ 已修改：添加柱状图配置
│   └── __tests__/
│       ├── monthlyStats.test.ts  # ✅ 3测试通过
│       ├── expenseMeta.test.ts   # ✅ 9测试通过
│       ├── statsCompare.test.ts  # ✅ 10测试通过
│       └── expense.test.ts       # 原有测试
├── views/
│   ├── StatsCompare.vue     # ✅ 对比统计页面
│   ├── Stats.vue            # 需要修改（#61）
│   └── __tests__/
│       └── StatsCompare.test.ts  # ✅ 6测试通过
├── types/
│   ├── expense.ts
│   ├── category.ts
│   └── budget.ts
└── router/
    └── index.ts             # ✅ 已添加/stats/compare路由
```

## 测试运行命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- --run src/services/__tests__/statsCompare.test.ts

# 运行特定切片的测试
npm test -- --run src/views/__tests__/StatsCompare.test.ts
```

## 注意事项

1. **Firebase Mock**: 测试时需要mock Firebase，参考现有测试文件的mock方式
2. **Vue Router Mock**: 测试Vue组件时需要mock useRoute和useRouter
3. **异步操作**: 预聚合和元数据更新是异步的，不阻塞主流程
4. **格式化函数**: 使用statsCompare.ts中的formatAmount和formatChangePercent
5. **颜色规范**: 本月#1890FF(深蓝)，上月#BAE7FF(浅蓝)，增长红色，下降绿色

## 启动命令

```bash
# 进入项目目录
cd /workspace

# 运行现有测试确认状态
npm test

# 开始开发#60和#61（可并行）
```

## Issue详情参考

- PRD: `gh issue view 53`
- 切片5: `gh issue view 60`
- 切片8: `gh issue view 61`
