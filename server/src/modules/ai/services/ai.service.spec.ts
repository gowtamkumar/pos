import { GoogleGenAI } from '@google/genai'
import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import { ProductEntity } from '../../product/entities/product.entity'
import { SaleEntity } from '../../sale/entities/sale.entity'
import { SaleItemEntity } from '../../sale/entities/sale-item.entity'
import { AiService } from './ai.service'

const mockGenerateContent = jest.fn()
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}))

function queryBuilder() {
  const builder: Record<string, jest.Mock> = {}
  for (const method of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'innerJoin',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'limit',
  ]) {
    builder[method] = jest.fn().mockReturnValue(builder)
  }
  builder.getRawOne = jest.fn().mockResolvedValue({ totalRevenue: '50', totalTransactions: '1' })
  builder.getRawMany = jest
    .fn()
    .mockResolvedValue([
      { productName: 'Milk', productSku: 'MILK', totalQuantity: '1', totalRevenue: '50' },
    ])
  return builder
}

describe('AiService', () => {
  let service: AiService
  let sales: ReturnType<typeof queryBuilder>
  let items: ReturnType<typeof queryBuilder>
  let settings: Record<string, string>
  const validInsights = {
    executiveSummary: 'Today had one completed sale. Milk needs replenishment.',
    restockInsights: [{ sku: 'MILK', reasoning: 'Replenish before the next trading day.' }],
    topPerformerInsights: [{ sku: 'MILK', insight: 'The only product sold today.' }],
    actionableRecommendations: ['Order milk from the supplier.'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateContent.mockReset()
    settings = { STORE_TIMEZONE: 'Asia/Dhaka' }
    sales = queryBuilder()
    items = queryBuilder()
    service = new AiService(
      {
        find: jest.fn().mockResolvedValue([
          { name: 'Milk', sku: 'MILK', stockQuantity: 0, lowStockThreshold: 5 },
          { name: 'Bread', sku: 'BREAD', stockQuantity: 2, lowStockThreshold: 5 },
        ]),
      } as unknown as Repository<ProductEntity>,
      { createQueryBuilder: () => sales } as unknown as Repository<SaleEntity>,
      { createQueryBuilder: () => items } as unknown as Repository<SaleItemEntity>,
      { get: (key: string) => settings[key] } as ConfigService,
    )
  })

  it('uses store calendar days and the same upper boundary for both sales queries', async () => {
    const result = await service.generateSalesInsights(1)
    const [sql, params] = sales.where.mock.calls[0]
    expect(sql).toContain("date_trunc('day'")
    expect(sql).toContain('(:days - 1)')
    expect(params).toMatchObject({ days: 1, timeZone: 'Asia/Dhaka' })
    expect(items.where).toHaveBeenCalledWith(sql, params)
    expect(sales.andWhere).toHaveBeenCalledWith('sale.createdAt <= :endDate', {
      endDate: params.endDate,
    })
    expect(items.andWhere).toHaveBeenCalledWith('sale.createdAt <= :endDate', {
      endDate: params.endDate,
    })
    expect(result.executiveSummary).toContain('Today generated $50.00')
  })

  it.each([0, 31, -1, 1.5, NaN])(
    'rejects invalid analysis days %s before querying',
    async (days) => {
      await expect(service.generateSalesInsights(days)).rejects.toThrow('days must be an integer')
      expect(sales.where).not.toHaveBeenCalled()
    },
  )

  it('describes a multi-day fallback accurately and skips the SDK without a key', async () => {
    const result = await service.generateSalesInsights(7)
    expect(result.executiveSummary).toContain('The last 7 calendar days (including today)')
    expect(result.engine).toBe('Deterministic Heuristic Fallback')
    expect(GoogleGenAI).not.toHaveBeenCalled()
  })

  it('allocates discounts and tax to item revenue consistently with the order total', async () => {
    const result = await service.generateSalesInsights()
    expect(
      items.addSelect.mock.calls.some(([sql]) =>
        sql.includes('item.subtotal * sale.total / sale.subtotal'),
      ),
    ).toBe(true)
    expect(result.totalRevenue).toBe(50)
    expect(result.topPerformers[0]).toMatchObject({ revenue: 50, contributionPercent: 100 })
  })

  it('keeps database numbers and every low-stock alert when Gemini supplies commentary', async () => {
    settings.GEMINI_API_KEY = 'test-key'
    settings.GEMINI_MODEL = 'configured-model'
    settings.GEMINI_TIMEOUT_MS = '2500'
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        ...validInsights,
        restockInsights: [
          ...validInsights.restockInsights,
          { sku: 'UNKNOWN', reasoning: 'Invented item' },
        ],
      }),
    })
    const result = await service.generateSalesInsights()
    expect(GoogleGenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      httpOptions: { timeout: 2500, retryOptions: { attempts: 1 } },
    })
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'configured-model',
        config: expect.objectContaining({
          responseMimeType: 'application/json',
          responseJsonSchema: expect.any(Object),
        }),
      }),
    )
    expect(result.engine).toBe('Google Gemini (configured-model)')
    expect(result.urgentRestock).toHaveLength(2)
    expect(result.urgentRestock[0]).toMatchObject({
      sku: 'MILK',
      currentStock: 0,
      threshold: 5,
      urgency: 'CRITICAL',
      recommendedOrderQty: 20,
      reasoning: validInsights.restockInsights[0].reasoning,
    })
    expect(result.urgentRestock[1].sku).toBe('BREAD')
    expect(result.topPerformers[0]).toMatchObject({
      revenue: 50,
      quantitySold: 1,
      contributionPercent: 100,
    })
  })

  it.each([
    '',
    'not JSON',
    'null',
    JSON.stringify({ ...validInsights, executiveSummary: { invalid: 'object' } }),
    JSON.stringify({ ...validInsights, restockInsights: [null] }),
    JSON.stringify({ ...validInsights, topPerformerInsights: [{ sku: 'MILK', revenue: '100' }] }),
    JSON.stringify({ ...validInsights, actionableRecommendations: [{}] }),
    JSON.stringify({ ...validInsights, actionableRecommendations: [] }),
  ])('falls back safely for invalid SDK response %s', async (text) => {
    settings.GEMINI_API_KEY = 'test-key'
    mockGenerateContent.mockResolvedValue({ text })
    const result = await service.generateSalesInsights()
    expect(result.engine).toBe('Deterministic Heuristic Fallback')
    expect(result.urgentRestock).toHaveLength(2)
    expect(result.topPerformers[0].revenue.toFixed(2)).toBe('50.00')
  })

  it('falls back on SDK errors without exposing credentials in logs', async () => {
    settings.GEMINI_API_KEY = 'test-key'
    mockGenerateContent.mockRejectedValue(new Error('timeout with secret test-key'))
    const warn = jest
      .spyOn((service as unknown as { logger: { warn: (message: string) => void } }).logger, 'warn')
      .mockImplementation(() => undefined)
    const result = await service.generateSalesInsights()
    expect(result.engine).toBe('Deterministic Heuristic Fallback')
    expect(warn).toHaveBeenCalledWith(
      'Gemini insights unavailable or invalid; using heuristic fallback',
    )
  })

  it('uses a bounded default timeout for invalid configuration', async () => {
    settings.GEMINI_API_KEY = 'test-key'
    settings.GEMINI_TIMEOUT_MS = 'invalid'
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(validInsights) })
    await service.generateSalesInsights()
    expect(GoogleGenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        httpOptions: { timeout: 15000, retryOptions: { attempts: 1 } },
      }),
    )
  })
})
