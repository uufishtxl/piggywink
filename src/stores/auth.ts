import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth'
import { auth, googleProvider, requestNotificationPermission } from '@/services/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const displayName = computed(() => user.value?.displayName || 'User')
  const photoURL = computed(() => user.value?.photoURL || null)

  // Initialize auth state listener
  function initAuthListener() {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        
        if (firebaseUser) {
          // Request notification permission on login
          await requestNotificationPermission()
        }
        
        resolve()
      })
    })
  }

  async function loginWithGoogle() {
    error.value = null
    loading.value = true
    
    try {
      console.log('Starting Google login...')
      console.log('Firebase API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✓ set' : '✗ missing')
      const result = await signInWithPopup(auth, googleProvider)
      user.value = result.user
      console.log('Login success:', result.user.email)
    } catch (e: any) {
      console.error('Login error:', e.code, e.message)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    error.value = null
    
    try {
      await signOut(auth)
      user.value = null
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    displayName,
    photoURL,
    initAuthListener,
    loginWithGoogle,
    logout
  }
})
