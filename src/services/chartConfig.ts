// 环形图配置深度模块
// 输入：分类聚合数据
// 输出：chartData、chartOptions、topThree（引线标注数据）

import type { CategoryAggregation } from '@/services/statsCalc'

const COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#D946EF', '#F43F5E', '#22C55E', '#EAB308'
]

// 柱状图颜色
const BAR_COLORS = {
  current: '#10B981',  // 本月深蓝
  previous: '#BAE7FF', // 上月浅蓝
}

interface TopThreeItem {
  categoryName: string
  percentage: number
  label: string
  color: string
}

export interface DoughnutChartConfig {
  chartData: {
    labels: string[]
    datasets: {
      data: number[]
      backgroundColor: string[]
      borderWidth: number
      borderColor: string
    }[]
  }
  chartOptions: Record<string, any>
  topThree: TopThreeItem[]
}

export function buildDoughnutChartConfig(
  aggregations: CategoryAggregation[]
): DoughnutChartConfig {
  // 输入已按金额降序排列（来自 aggregateByCategory）

  // 前3项用于引线标注
  const topThree: TopThreeItem[] = aggregations.slice(0, 3).map((agg, i) => ({
    categoryName: agg.categoryName,
    percentage: agg.percentage,
    label: `${agg.categoryName} ${Math.round(agg.percentage)}%`,
    color: COLORS[i % COLORS.length],
  }))

  // chartData
  const chartData = {
    labels: aggregations.map(c => c.categoryName),
    datasets: [{
      data: aggregations.map(c => c.totalAmount),
      backgroundColor: aggregations.map((_, i) => COLORS[i % COLORS.length]),
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  }

  // chartOptions
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const cat = aggregations[ctx.dataIndex]
            return ` ${cat.categoryName}: ¥${cat.totalAmount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
          }
        }
      },
      datalabels: {
        // 禁用裁剪，确保引线标签不被截断
        clip: false,
        // 只对前3项显示标签
        display: (ctx: any) => ctx.dataIndex < 3,
        formatter: (_value: number, ctx: any) => {
          const cat = aggregations[ctx.dataIndex]
          return `${cat.categoryName} ${Math.round(cat.percentage)}%`
        },
        color: '#374151',
        font: {
          size: 10,
          weight: 'bold' as const,
        },
        // 标签位置：从扇区向外延伸
        anchor: 'end' as const,
        align: 'end' as const,
        offset: 4,
        padding: 2,
        // 引线配置 - 从扇区边缘指向标签
        connector: {
          display: true,
          strokeStyle: '#9CA3AF',
          lineWidth: 1,
        },
      },
    }
  }

  return { chartData, chartOptions, topThree }
}

// 水平柱状图配置
// 用于TOP3分类对比
export interface BarChartConfig {
  chartData: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
      borderWidth: number
    }[]
  }
  chartOptions: Record<string, any>
}

export interface BarChartDataItem {
  categoryName: string
  categoryIcon: string
  currentAmount: number
  previousAmount: number
}

/**
 * 构建水平柱状图配置
 * @param data TOP3分类数据
 * @returns 柱状图配置
 */
export function buildBarChartConfig(data: BarChartDataItem[]): BarChartConfig {
  const labels = data.map(item => item.categoryName)

  const chartData = {
    labels,
    datasets: [
      {
        label: '本月',
        data: data.map(item => item.currentAmount),
        backgroundColor: BAR_COLORS.current,
        borderColor: BAR_COLORS.current,
        borderWidth: 1,
      },
      {
        label: '上月',
        data: data.map(item => item.previousAmount),
        backgroundColor: BAR_COLORS.previous,
        borderColor: BAR_COLORS.previous,
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
    layout: {
      padding: {
        right: 60,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        display: false,
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const datasetLabel = ctx.dataset.label
            const value = ctx.raw as number
            return ` ${datasetLabel}: ¥${value.toFixed(2)}`
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
  }

  return { chartData, chartOptions }
}
