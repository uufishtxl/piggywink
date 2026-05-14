import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot,
  Timestamp,
  runTransaction
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
    categories.value.filter(c => c.isSafe)  // isSafe=true: 常规类别，始终计入统计
  )

  function getUserCategoriesRef() {
    if (!authStore.user) throw new Error('User not logged in')
    return collection(db, 'users', authStore.user.uid, 'categories')
  }

  // 首次登录初始化 20 个预设分类（使用事务防并发 + 名称去重）
  async function initPresetCategories() {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      // 先读取现有分类名称（事务外读取，用于去重）
      const categoriesRef = getUserCategoriesRef()
      const existingSnapshot = await getDocs(categoriesRef)
      const existingNames = new Set(
        existingSnapshot.docs.map(d => d.data().name as string)
      )
      
      // 过滤出尚未创建的预设分类
      const missingPresets = PRESET_CATEGORIES.filter(
        preset => !existingNames.has(preset.name)
      )
      
      if (missingPresets.length === 0) return // 全部已存在，跳过
      
      // 使用事务和标记文档，确保只有一个调用者能成功创建分类
      const markerRef = doc(db, 'users', authStore.user.uid, '_meta', 'categoriesInitialized')
      
      await runTransaction(db, async (transaction) => {
        const marker = await transaction.get(markerRef)
        if (marker.exists()) return // 已初始化，跳过
        
        // 在事务中创建缺失的预设分类
        missingPresets.forEach(preset => {
          const docRef = doc(categoriesRef)
          transaction.set(docRef, { ...preset, createdAt: Timestamp.now() })
        })
        
        // 设置初始化标记
        transaction.set(markerRef, { initializedAt: Timestamp.now() })
      })
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

  // 添加自定义分类（同名检查）
  async function addCategory(category: Omit<Category, 'id' | 'createdAt'>) {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      // 检查同名分类是否已存在
      const duplicate = categories.value.find(
        c => c.name === category.name
      )
      if (duplicate) {
        throw new Error(`分类「${category.name}」已存在`)
      }
      
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

  // 更新分类（重命名时检查同名）
  async function updateCategory(id: string, updates: Partial<Category>) {
    if (!authStore.user) return
    
    loading.value = true
    error.value = null
    
    try {
      // 如果更新了名称，检查是否与其他分类重名
      if (updates.name !== undefined) {
        const duplicate = categories.value.find(
          c => c.id !== id && c.name === updates.name
        )
        if (duplicate) {
          throw new Error(`分类「${updates.name}」已存在`)
        }
      }
      
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