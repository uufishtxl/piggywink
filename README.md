# Piggy Wink 🐷

AI 智能记账 PWA 应用，极简生活每一天。

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **样式**: SCSS
- **路由**: Vue Router
- **后端**: Firebase (Auth, Firestore, Cloud Functions, FCM)
- **LLM**: Gemini API
- **PWA**: vite-plugin-pwa

## 开发

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env
# 然后编辑 .env 填入 Firebase 配置

# 开发模式
npm run dev

# 构建 PWA
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 公共组件
├── composables/     # 组合式函数
├── router/          # 路由配置
├── services/       # 服务层 (Firebase)
├── stores/         # Pinia 状态管理
├── styles/         # SCSS 样式
├── types/          # TypeScript 类型
└── views/           # 页面组件
```

## Firebase 配置

需要在 Firebase Console 创建项目并启用：
- Authentication (Google 登录)
- Firestore Database
- Cloud Functions
- Cloud Messaging

然后将配置填入 `.env` 文件。

## 功能

- [ ] 用户认证 (Firebase Auth)
- [ ] 支出记录 (语音/文本输入 + Gemini 解析)
- [ ] 预算管理 (按类别设置月度预算)
- [ ] 资产管理 (多账户支持)
- [ ] 月度统计 (图表 + 筛选)
- [ ] 推送通知 (FCM)

## License

MIT
