import { describe, it, expect } from 'vitest'
import { buildDoughnutChartConfig } from '@/services/chartConfig'

describe('环形图配置 (Doughnut Chart Config)', () => {
  const mockAggregations = [
    { categoryId: '1', categoryName: '食材', categoryIcon: '🍎', totalAmount: 500, percentage: 49 },
    { categoryId: '2', categoryName: '交通', categoryIcon: '🚌', totalAmount: 300, percentage: 29.4 },
    { categoryId: '3', categoryName: '娱乐', categoryIcon: '🎮', totalAmount: 150, percentage: 14.7 },
    { categoryId: '4', categoryName: '其他', categoryIcon: '📦', totalAmount: 70, percentage: 6.9 },
  ]

  it('按金额降序排列取前3项作为标注', () => {
    const config = buildDoughnutChartConfig(mockAggregations)

    // 前3项应该是食材、交通、娱乐（已按金额降序）
    expect(config.topThree).toHaveLength(3)
    expect(config.topThree[0].categoryName).toBe('食材')
    expect(config.topThree[1].categoryName).toBe('交通')
    expect(config.topThree[2].categoryName).toBe('娱乐')
  })

  it('引线标注格式为 {name} {percent}%', () => {
    const config = buildDoughnutChartConfig(mockAggregations)

    expect(config.topThree[0].label).toBe('食材 49%')
    expect(config.topThree[1].label).toBe('交通 29%')
    expect(config.topThree[2].label).toBe('娱乐 15%')
  })

  it('百分比取整（四舍五入）', () => {
    const aggregations = [
      { categoryId: '1', categoryName: '食材', categoryIcon: '🍎', totalAmount: 500, percentage: 49.6 },
      { categoryId: '2', categoryName: '交通', categoryIcon: '🚌', totalAmount: 300, percentage: 29.4 },
      { categoryId: '3', categoryName: '娱乐', categoryIcon: '🎮', totalAmount: 150, percentage: 14.7 },
    ]

    const config = buildDoughnutChartConfig(aggregations)

    expect(config.topThree[0].label).toBe('食材 50%')
    expect(config.topThree[1].label).toBe('交通 29%')
    expect(config.topThree[2].label).toBe('娱乐 15%')
  })

  it('不足3项时全部显示', () => {
    const fewAggregations = [
      { categoryId: '1', categoryName: '食材', categoryIcon: '🍎', totalAmount: 500, percentage: 70 },
      { categoryId: '2', categoryName: '交通', categoryIcon: '🚌', totalAmount: 200, percentage: 30 },
    ]

    const config = buildDoughnutChartConfig(fewAggregations)

    expect(config.topThree).toHaveLength(2)
    expect(config.topThree[0].label).toBe('食材 70%')
    expect(config.topThree[1].label).toBe('交通 30%')
  })

  it('chartOptions 禁用 legend', () => {
    const config = buildDoughnutChartConfig(mockAggregations)

    expect(config.chartOptions.plugins.legend.display).toBe(false)
  })

  it('datalabels 配置启用了引线', () => {
    const config = buildDoughnutChartConfig(mockAggregations)

    expect(config.chartOptions.plugins.datalabels).toBeDefined()
    // display 是一个函数，只对前3项显示标签
    expect(typeof config.chartOptions.plugins.datalabels.display).toBe('function')
    // connector 配置存在
    expect(config.chartOptions.plugins.datalabels.connector).toBeDefined()
    expect(config.chartOptions.plugins.datalabels.connector.display).toBe(true)
  })

  it('chartData 包含所有分类数据', () => {
    const config = buildDoughnutChartConfig(mockAggregations)

    expect(config.chartData.labels).toHaveLength(4)
    expect(config.chartData.datasets[0].data).toHaveLength(4)
    expect(config.chartData.labels).toEqual(['食材', '交通', '娱乐', '其他'])
    expect(config.chartData.datasets[0].data).toEqual([500, 300, 150, 70])
  })
})
