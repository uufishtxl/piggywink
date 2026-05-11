// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssetAccountForm from '@/components/AssetAccountForm.vue'

describe('AssetAccountForm', () => {
  it('显示表单字段', () => {
    const wrapper = mount(AssetAccountForm)
    
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('.icon-carousel').exists()).toBe(true)
    expect(wrapper.find('.submit-btn').exists()).toBe(true)
  })
  
  it('提交表单时发出事件', async () => {
    const wrapper = mount(AssetAccountForm)
    
    await wrapper.find('input[type="number"]').setValue(50000)
    await wrapper.find('input[type="text"]').setValue('招商银行储蓄卡')
    await wrapper.find('.icon-carousel__item').trigger('click')
    await wrapper.find('.submit-btn').trigger('click')
    
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
  
  it('点击取消按钮发出取消事件', async () => {
    const wrapper = mount(AssetAccountForm)
    
    await wrapper.find('.cancel-btn').trigger('click')
    
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})