export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string | null;
  category?: Category | null;
  name: string;
  sku: string;
  barcode: string;
  retailPrice: number | string;
  costPrice: number | string;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  customerName: string;
  customerPhone?: string | null;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  amountTendered: number;
  changeDue: number;
  paymentMethod: string;
  status: string;
  notes?: string | null;
  items: SaleItem[];
  createdAt: string;
}

export interface DailySalesSummary {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  totalTax: number;
  totalDiscount: number;
  totalCashTendered: number;
  totalChangeGiven: number;
}

export interface CheckoutPayload {
  items: {
    productId: string;
    quantity: number;
  }[];
  amountTendered: number;
  discount?: number;
  taxRate?: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface AiRestockItem {
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  recommendedOrderQty: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE';
  reasoning: string;
}

export interface AiTopPerformer {
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  contributionPercent: number;
  insight: string;
}

export interface AiSalesInsightResponse {
  executiveSummary: string;
  inventoryHealthScore: number;
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  urgentRestock: AiRestockItem[];
  topPerformers: AiTopPerformer[];
  actionableRecommendations: string[];
  generatedAt: string;
  engine: string;
}

