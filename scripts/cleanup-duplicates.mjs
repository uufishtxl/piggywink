#!/usr/bin/env node

/**
 * Firebase 数据库重复数据清理脚本
 * 
 * 清理 categories 和 budgets 集合中的重复文档：
 * 1. 名称以 "1" 结尾的文档（如 "餐饮1"、"餐1"）
 * 2. 完全同名的文档（保留第一个，删除后续重复）
 * 
 * 用法：
 *   node scripts/cleanup-duplicates.mjs --uid=<userId>            # dry-run 模式，只显示会删除什么
 *   node scripts/cleanup-duplicates.mjs --uid=<userId> --confirm  # 真正执行删除
 * 
 * 环境要求：
 *   项目根目录需有 .env 文件，包含 VITE_FIREBASE_* 配置
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore'

// ─── 读取 .env ───────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')

function loadEnv(path) {
  const content = readFileSync(path, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    env[key] = value
  }
  return env
}

const env = loadEnv(envPath)

// ─── 解析命令行参数 ──────────────────────────────────────────────────
const args = process.argv.slice(2)
const uidArg = args.find(a => a.startsWith('--uid='))
const confirm = args.includes('--confirm')

if (!uidArg) {
  console.error('错误：请提供 --uid=<userId> 参数')
  console.error('用法：node scripts/cleanup-duplicates.mjs --uid=<userId> [--confirm]')
  process.exit(1)
}

const userId = uidArg.split('=')[1]
if (!userId) {
  console.error('错误：userId 不能为空')
  process.exit(1)
}

// ─── 初始化 Firebase ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('错误：.env 文件中缺少必要的 Firebase 配置')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// ─── 工具函数 ────────────────────────────────────────────────────────


/**
 * 批量删除文档（每批最多 500 条，Firestore 限制）
 */
async function batchDelete(collectionRef, docIds) {
  // Firestore client SDK 没有原生 batch 支持超过 500 条，
  // 但这里用循环逐条删除更简单可靠
  let deleted = 0
  for (const id of docIds) {
    await deleteDoc(doc(collectionRef, id))
    deleted++
  }
  return deleted
}

// ─── 主流程 ──────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Firebase 重复数据清理工具')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`用户 ID:   ${userId}`)
  console.log(`运行模式:  ${confirm ? '🔴 真实删除' : '🟡 干跑模式 (dry-run)'}`)
  console.log()

  // ── 1. 清理 Categories ──────────────────────────────────────────────
  console.log('─── 步骤 1: 清理 Categories ───────────────────────────')
  const categoriesRef = collection(db, 'users', userId, 'categories')
  const categoriesSnap = await getDocs(categoriesRef)

  const allCategories = categoriesSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }))

  console.log(`当前分类总数: ${allCategories.length}`)

  // 找出所有名称以 "1" 结尾的分类
  const suffix1Categories = allCategories.filter(c =>
    typeof c.name === 'string' && c.name.endsWith('1')
  )

  // 找出完全同名的重复分类（按 createdAt 排序，保留最旧的）
  const sortedByName = [...allCategories]
    .filter(c => typeof c.name === 'string')
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? a.createdAt?.getTime?.() ?? 0
      const tb = b.createdAt?.toMillis?.() ?? b.createdAt?.getTime?.() ?? 0
      return ta - tb // 升序，最旧的在前
    })
  const nameSeen = new Map() // name → first (oldest) doc
  const exactDuplicates = []
  for (const cat of sortedByName) {
    if (nameSeen.has(cat.name)) {
      exactDuplicates.push(cat)
    } else {
      nameSeen.set(cat.name, cat)
    }
  }

  // 合并两种重复
  const duplicateCategories = [...new Set([...suffix1Categories, ...exactDuplicates])]
  // 去重（同一个 doc 可能同时出现在两个列表中）
  const seenIds = new Set()
  const uniqueDuplicates = []
  for (const cat of duplicateCategories) {
    if (!seenIds.has(cat.id)) {
      seenIds.add(cat.id)
      uniqueDuplicates.push(cat)
    }
  }
  const finalDuplicates = uniqueDuplicates

  if (finalDuplicates.length === 0) {
    console.log('✅ 未发现重复分类')
  } else {
    // 按名称分组显示保留/删除情况
    const groups = new Map() // name → { keep, delete[] }
    for (const cat of sortedByName) {
      if (!groups.has(cat.name)) {
        groups.set(cat.name, { keep: cat, delete: [] })
      } else {
        groups.get(cat.name).delete.push(cat)
      }
    }
    console.log(`发现 ${finalDuplicates.length} 个重复分类（将保留 createdAt 最早的）：`)
    console.log()
    for (const [name, { keep, delete: dels }] of groups) {
      if (dels.length === 0) continue
      const keepTime = keep.createdAt?.toDate?.()?.toISOString?.() || keep.createdAt || '未知'
      console.log(`  📌 "${name}"`)
      console.log(`     ✅ 保留: ${keep.id}  (createdAt: ${keepTime})`)
      for (const d of dels) {
        const delTime = d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt || '未知'
        console.log(`     ❌ 删除: ${d.id}  (createdAt: ${delTime})`)
      }
    }
    console.log()

    if (confirm) {
      console.log('正在删除...')
      const deleted = await batchDelete(categoriesRef, finalDuplicates.map(c => c.id))
      console.log(`✅ 已删除 ${deleted} 个重复分类`)

      // 显示删除后的数量
      const afterSnap = await getDocs(categoriesRef)
      console.log(`删除后分类总数: ${afterSnap.docs.length} (之前: ${allCategories.length})`)
    } else {
      console.log(`[dry-run] 将删除以上 ${finalDuplicates.length} 个分类`)
      console.log('添加 --confirm 参数以执行实际删除')
    }
  }

  console.log()

  // ── 2. 清理 Budgets ─────────────────────────────────────────────────
  console.log('─── 步骤 2: 清理 Budgets ─────────────────────────────')
  const budgetsRef = collection(db, 'users', userId, 'budgets')
  const budgetsSnap = await getDocs(budgetsRef)

  const allBudgets = budgetsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }))

  console.log(`当前预算总数: ${allBudgets.length}`)

  // 找出引用了重复分类的预算
  const duplicateCategoryIds = new Set(finalDuplicates.map(c => c.id))
  const duplicateBudgets = allBudgets.filter(b => duplicateCategoryIds.has(b.categoryId))

  if (duplicateBudgets.length === 0) {
    console.log('✅ 未发现关联重复分类的预算')
  } else {
    console.log(`发现 ${duplicateBudgets.length} 个关联重复分类的预算：`)
    console.log()
    for (const budget of duplicateBudgets) {
      const catName = finalDuplicates.find(c => c.id === budget.categoryId)?.name || '未知'
      console.log(`  📌 预算 "${budget.name || budget.id}"  →  关联分类: "${catName}" (${budget.categoryId})  月份: ${budget.month}`)
    }
    console.log()

    if (confirm) {
      console.log('正在删除...')
      const deleted = await batchDelete(budgetsRef, duplicateBudgets.map(b => b.id))
      console.log(`✅ 已删除 ${deleted} 个重复预算`)

      const afterSnap = await getDocs(budgetsRef)
      console.log(`删除后预算总数: ${afterSnap.docs.length} (之前: ${allBudgets.length})`)
    } else {
      console.log(`[dry-run] 将删除以上 ${duplicateBudgets.length} 个预算`)
      console.log('添加 --confirm 参数以执行实际删除')
    }
  }

  console.log()
  console.log('═══════════════════════════════════════════════════════')
  if (!confirm) {
    console.log('  🟡 干跑模式结束。添加 --confirm 执行真实删除。')
  } else {
    console.log('  ✅ 清理完成！')
  }
  console.log('═══════════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('脚本执行出错:', err)
  process.exit(1)
})
