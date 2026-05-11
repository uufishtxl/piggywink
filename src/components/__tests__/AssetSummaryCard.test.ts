// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetSummaryCard from '@/components/AssetSummaryCard.vue'
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
    name: '信用卡',
    type: 'credit',
    balance: 10000,
    createdAt: new Date()
  }
]

describe('AssetSummaryCard', () => {
  it('显示净资产卡片', () => {
    const wrapper = mount(AssetSummaryCard, {
      props: {
        accounts: mockAccounts,
        showAmounts: true
      }
    })
    
    expect(wrapper.text()).toContain('净资产')
    expect(wrapper.text()).toContain('¥40,000.00') // 50000 - 10000
    expect(wrapper.text()).toContain('总资产')
    expect(wrapper.text()).toContain('¥60,000.00') // 50000 + 10000
    expect(wrapper.text()).toContain('总负债')
    expect(wrapper.text()).toContain('¥10,000.00')
  })
  
  it('隐藏金额时显示星号', () => {
    const wrapper = mount(AssetSummaryCard, {
      props: {
        accounts: mockAccounts,
        showAmounts: false
      }
    })
    
    expect(wrapper.text()).toContain('¥••••••')
    expect(wrapper.text()).not.toContain('¥40,000.00')
    expect(wrapper.text()).not.toContain('¥60,000.00')
    expect(wrapper.text()).not.toContain('¥10,000.00')
  })
  
  it('点击眼睛图标发出切换事件', async () => {
    const wrapper = mount(AssetSummaryCard, {
      props: {
        accounts: mockAccounts,
        showAmounts: true
      }
    })
    
    await wrapper.find('.asset-summary__toggle').trigger('click')
    
    expect(wrapper.emitted('toggleVisibility')).toBeTruthy()
  })
  
  it('显示较上月变化（正向）', () => {
    const wrapper = mount(AssetSummaryCard, {
      props: {
        accounts: mockAccounts,
        showAmounts: true,
        previousNetAssets: 30000
      }
    })
    
    expect(wrapper.text()).toContain('较上月')
    expect(wrapper.text()).toContain('+¥10,000.00')
    expect(wrapper.text()).toContain('+33%')
  })
  
  it('显示较上月变化（负向）', () => {
    const wrapper = mount(AssetSummaryCard, {
      props: {
        accounts: mockAccounts,
        showAmounts: true,
        previousNetAssets: 50000
      }
    })
    
    expect(wrapper.text()).toContain('较上月')
    expect(wrapper.text()).toContain('-¥10,000.00')
    expect(wrapper.text()).toContain('-20%')
  })
  
  it('没有上月数据时不显示变化', () => {
    const wrapper = mount(AssetSummaryCard, {
      props: {
        accounts: mockAccounts,
        showAmounts: true,
        previousNetAssets: null
      }
    })
    
    expect(wrapper.text()).not.toContain('较上月')
  })
})