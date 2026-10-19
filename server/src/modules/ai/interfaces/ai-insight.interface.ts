import type { ProductEntity } from '../../product/entities/product.entity'

export interface AiRestockItem {
  productName: string
  sku: string
  currentStock: number
  threshold: number
  recommendedOrderQty: number
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE'
  reasoning: string
}

export interface AiTopPerformer {
  productName: string
  sku: string
  quantitySold: number
  revenue: number
  contributionPercent: number
  insight: string
}

export interface AiSalesInsightResponse {
  executiveSummary: string
  inventoryHealthScore: number // 0 - 100%
  totalRevenue: number
  totalTransactions: number
  averageOrderValue: number
  urgentRestock: AiRestockItem[]
  topPerformers: AiTopPerformer[]
  // actionableRecommendations: string[]
  generatedAt: string
  engine: string
}

export interface SalesPeriod {
  days: number
  endDate: Date
  timeZone: string
  startCondition: string
}

export interface SalesMetrics {
  totalRevenue: number
  totalTransactions: number
  averageOrderValue: number
}

export interface InventoryHealth {
  lowStockProducts: ProductEntity[]
  inventoryHealthScore: number
  totalCatalogProducts: number
}

export interface GeminiInsights {
  executiveSummary: string
  restockInsights: { sku: string; reasoning: string }[]
  topPerformerInsights: { sku: string; insight: string }[]
  actionableRecommendations: string[]
}
