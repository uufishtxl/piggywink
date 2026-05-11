import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from './auth'
import type { Category } from '@/types/category'
import { PRESET_CATEGORIES } from '@/types/category'

export const useCategoriesStore = defineStore('categories', () => {
  const authStore = useAuthStore()
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const safeCategories = computed(() => 
    categories.value.filter(c => c.isSafe)  // isSafe=true: 始终计入统计
  )

  function getUserCategoriesRef() {
    if (!authStore.user) throw new Error('User not logged in')
    return collection(db, 'users', authStore.user.uid, 'categories')
  }

  // 首次登录初始化 20 个预设分类
  async function initPresetCategories() {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const categoriesRef = getUserCategoriesRef()
      const snapshot = await getDocs(categoriesRef)
      
      // 已有分类就不重复创建
      if (!snapshot.empty) return
      
      for (const preset of PRESET_CATEGORIES) {
        const docRef = doc(categoriesRef)
        await setDoc(docRef, {
          ...preset,
          createdAt: Timestamp.now()
        })
      }
    } catch (e: any) {
      error.value = e.message
      console.error('Error initializing categories:', e)
    } finally {
      loading.value = false
    }
  }

  // 实时订阅
  function subscribeToCategories() {
    if (!authStore.user) return () => {}
    
    loading.value = true
    
    const categoriesRef = getUserCategoriesRef()
    
    const unsubscribe = onSnapshot(
      categoriesRef,
      (snapshot) => {
        categories.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Category[]
        
        loading.value = false
      },
      (e) => {
        error.value = e.message
        loading.value = false
      }
    )
    
    return unsubscribe
  }

  // 添加自定义分类
  async function addCategory(category: Omit<Category, 'id' | 'createdAt'>) {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const categoriesRef = getUserCategoriesRef()
      const docRef = doc(categoriesRef)
      await setDoc(docRef, {
        ...category,
        createdAt: Timestamp.now()
      })
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // 更新分类
  async function updateCategory(id: string, updates: Partial<Category>) {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const categoryRef = doc(db, 'users', authStore.user.uid, 'categories', id)
      await setDoc(categoryRef, updates, { merge: true })
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // 删除分类（系统预设不可删）
  async function deleteCategory(id: string) {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      const categoryRef = doc(db, 'users', authStore.user.uid, 'categories', id)
      await deleteDoc(categoryRef)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function getCategoryById(id: string) {
    return categories.value.find(c => c.id === id)
  }

  function findCategoryByName(name: string) {
    return categories.value.find(
      c => c.name.includes(name) || name.includes(c.name)
    )
  }

  return {
    categories,
    loading,
    error,
    safeCategories,
    initPresetCategories,
    subscribeToCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    findCategoryByName
  }
})