// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetAccountList from '@/components/AssetAccountList.vue'
import type { AssetAccount } from '@/types/asset'

const mockAccounts: AssetAccount[] = [
  {
    id: 'acc1',
    name: '招商银行储蓄卡',
    type: 'savings',
    balance: 50000,
    createdAt: new Date()
  },
  {
    id: 'acc2',
    name: '工商银行储蓄卡',
    type: 'savings',
    balance: 30000,
    createdAt: new Date()
  },
  {
    id: 'acc3',
    name: '支付宝',
    type: 'ewallet',
    balance: 5000,
    createdAt: new Date()
  }
]

describe('AssetAccountList', () => {
  it('按类型分组显示资产账户', () => {
    const wrapper = mount(AssetAccountList, {
      props: {
        accounts: mockAccounts,
        showAmounts: true
      }
    })
    
    // 应该有两个分组：储蓄卡和电子钱包
    expect(wrapper.findAll('.type-group')).toHaveLength(2)
    
    // 储蓄卡分组应该有两个账户
    const savingsGroup = wrapper.findAll('.type-group')[0]
    expect(savingsGroup.findAll('.asset-account-item')).toHaveLength(2)
    
    // 电子钱包分组应该有一个账户
    const ewalletGroup = wrapper.findAll('.type-group')[1]
    expect(ewalletGroup.findAll('.asset-account-item')).toHaveLength(1)
  })
  
  it('显示分组标题和汇总金额', () => {
    const wrapper = mount(AssetAccountList, {
      props: {
        accounts: mockAccounts,
        showAmounts: true
      }
    })
    
    expect(wrapper.text()).toContain('储蓄卡')
    expect(wrapper.text()).toContain('¥80,000.00') // 50000 + 30000
    expect(wrapper.text()).toContain('电子钱包')
    expect(wrapper.text()).toContain('¥5,000.00')
  })
  
  it('隐藏金额时显示星号', () => {
    const wrapper = mount(AssetAccountList, {
      props: {
        accounts: mockAccounts,
        showAmounts: false
      }
    })
    
    expect(wrapper.text()).toContain('¥••••••')
    expect(wrapper.text()).not.toContain('¥80,000.00')
    expect(wrapper.text()).not.toContain('¥5,000.00')
  })
  
  it('显示空状态', () => {
    const wrapper = mount(AssetAccountList, {
      props: {
        accounts: [],
        showAmounts: true
      }
    })
    
    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('暂无资产账户')
  })
  
  it('显示loading状态', () => {
    const wrapper = mount(AssetAccountList, {
      props: {
        accounts: [],
        loading: true,
        showAmounts: true
      }
    })
    
    expect(wrapper.find('.loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('加载中...')
  })
})