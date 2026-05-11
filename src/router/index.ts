import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/Stats.vue')
  },
  {
    path: '/assets',
    name: 'Assets',
    component: () => import('@/views/Assets.vue')
  },
  {
    path: '/assets/trends',
    name: 'AssetTrends',
    component: () => import('@/views/AssetTrends.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue')
  },
  {
    path: '/settings/categories',
    name: 'SettingsCategories',
    component: () => import('@/views/SettingsCategories.vue')
  },
  {
    path: '/budgets',
    name: 'Budgets',
    component: () => import('@/views/Budgets.vue')
  },
  {
    path: '/budgets/add',
    name: 'BudgetAdd',
    component: () => import('@/views/BudgetAdd.vue')
  },
  {
    path: '/budgets/:categoryId',
    name: 'BudgetDetail',
    component: () => import('@/views/BudgetDetail.vue')
  },
  {
    path: '/expense/:id/edit',
    name: 'ExpenseEdit',
    component: () => import('@/views/ExpenseEdit.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  // Wait for auth to initialize
  if (authStore.loading) {
    await authStore.initAuthListener()
  }
  
  // Redirect to login if not authenticated
  if (!authStore.isLoggedIn && to.name !== 'Login') {
    return { name: 'Login' }
  } else if (authStore.isLoggedIn && to.name === 'Login') {
    return { name: 'Home' }
  }
})

export default router
