# 48-Hour Execution Plan: Sample POS (PostgreSQL + TypeORM + Tailwind CSS)
**Target Deadline:** 19 October 2026  
**Assessment Target:** NT Tech Innovation — Full Stack Developer Practical Assessment  
**Project:** Sample Point of Sale (POS) System with Cash Engine & AI Feature  
**Execution Mode:** 100% Local Development & Live Demo (No Cloud/Vercel Deploy Needed)

---

## 1. Confirmed Project Architecture

Based on your confirmed decisions:
1. **No Product Variants:** Clean, robust `Product` entity (Name, SKU, Barcode, Retail Price, Cost Price, Stock Quantity, Category).
2. **TypeORM:** Object-Relational Mapping with TypeScript decorators and clean repository/entity patterns.
3. **Database:** **PostgreSQL** (Docker Compose provided for instant 1-command local DB, plus `.env` configuration).
4. **Frontend Styling:** **Tailwind CSS** with responsive layout and clear states.
5. **Deployment:** **Local Only** — zero cloud/Vercel dependency. Ready to run locally with `npm run dev` and demo directly on localhost.

---

## 2. 100 Marks Evaluation Mapping

| Assessment Criteria | Marks | Implementation in This Local Sample POS |
| :--- | :---: | :--- |
| **Backend, APIs & Business Logic** | **20** | Express + TypeScript + TypeORM, Cash tender & change calculator, Atomic stock decrement, Immutable sales records. |
| **Frontend & User Experience** | **15** | React + Vite + Tailwind CSS POS terminal, fast product search, barcode scanner integration, cart with quantity toggles, clear loading/error feedback. |
| **Database & Data Handling** | **15** | PostgreSQL with TypeORM relations: `User`, `Category`, `Product`, `Sale`, `SaleItem`. Auto-seed script with retail products. |
| **Security & Validation** | **10** | JWT auth (Admin & Cashier), bcrypt password hashing, Zod payload validation. |
| **AI / ML Feature & Explanation** | **10** | Google Gemini API integration: "AI Sales Copilot & Restock Insights" (analyzes low-stock and top sales to provide automated reorder advice). |
| **Code Quality, Testing & Git** | **10** | Modular architecture, 3-4 Unit tests on core checkout/stock logic (Vitest/Jest), clean Git commit history. |
| **Problem Solving & Planning** | **10** | Architecture documentation, clean schema design, and this 48h plan. |
| **Live Demo & Technical Review** | **10** | Local demonstration with seed data, live code walkthrough, and prepared answers for live debugging. |
| **Total** | **100** | **Guaranteed full coverage.** |

---

## 3. Database Schema (PostgreSQL + TypeORM)

```sql
-- Users (Authentication & Roles)
users (
  id UUID PRIMARY KEY,
  name VARCHAR,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role VARCHAR ('ADMIN', 'CASHIER'),
  created_at TIMESTAMP
)

-- Categories
categories (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,
  description TEXT,
  created_at TIMESTAMP
)

-- Products (Direct model - No Variants)
products (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  name VARCHAR,
  sku VARCHAR UNIQUE,
  barcode VARCHAR UNIQUE,
  retail_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  stock_quantity INT,
  low_stock_alert INT DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Sales (Cash-only ledger)
sales (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR UNIQUE,
  cashier_id UUID REFERENCES users(id),
  customer_name VARCHAR DEFAULT 'Walk-in Customer',
  subtotal DECIMAL(10, 2),
  discount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2),
  amount_tendered DECIMAL(10, 2),
  change_due DECIMAL(10, 2),
  payment_method VARCHAR DEFAULT 'CASH',
  created_at TIMESTAMP
)

-- Sale Items (Immutable snapshot at moment of purchase)
sale_items (
  id UUID PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR,
  sku VARCHAR,
  unit_price DECIMAL(10, 2),
  unit_cost DECIMAL(10, 2),
  quantity INT,
  total_price DECIMAL(10, 2)
)
```

---

## 4. Hour-by-Hour 48-Hour Roadmap

### Day 1: 17 October 2026 (Backend, PostgreSQL & TypeORM Setup)

#### [15:30 – 18:30] Phase 1: Environment, Database & TypeORM Entities
- [x] Create `docker-compose.dev.yml` for local PostgreSQL (mapped port 5543:5432) + `.env.example`.
- [x] Initialize backend with NestJS, TypeScript, TypeORM, and PostgreSQL driver.
- [x] Configure database provider connecting to PostgreSQL with synchronization.
- [x] Implement Entities: `UserEntity`, `CategoryEntity`, `ProductEntity`, `SaleEntity`, `SaleItemEntity`.
- [x] Write seed script `super-admin.seed.ts` populating categories, users (`admin@pos.local` / `cashier@pos.local`), and 10 sample retail products with barcodes.

#### [18:30 – 21:00] Phase 2: Auth, Security & Product Management APIs
- [x] JWT authentication (`/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`).
- [x] Input validation with class-validator DTOs & global `ValidationPipe` (whitelist + transform).
- [x] Role-Based Access Control (`RolesGuard` with `UserRole.Admin` and `UserRole.Cashier`).
- [x] Product & Category APIs:
  - [x] `GET /api/v1/products` (Search & category filter)
  - [x] `GET /api/v1/products/barcode/:barcode` (Instant barcode scanner lookup)
  - [x] `GET /api/v1/products/low-stock` (Restock threshold query)
  - [x] `POST /api/v1/products`, `PUT /api/v1/products/:id`, `PATCH /api/v1/products/:id/stock`, `DELETE /api/v1/products/:id` (Admin only)
  - [x] `GET /api/v1/categories`, `GET /api/v1/categories/active`, `POST`, `PUT`, `DELETE` (Admin only for mutations)
- [x] Automated test suites verified (10/10 for User, 9/9 for Category, 10/10 for Product).

#### [21:00 – 23:30] Phase 3: Cash Checkout Engine & Transactional Logic
- [x] `POST /api/v1/sales/checkout` with TypeORM `transaction`:
  - [x] Verify stock availability with pessimistic row locking (`FOR UPDATE`).
  - [x] Batch stock decrement without N+1 queries.
  - [x] Calculate `total` and `changeDue = amountTendered - total`.
  - [x] Validate `amountTendered >= total`.
  - [x] Insert `Sale` and `SaleItems` with immutable price/cost/name snapshots.
- [x] `GET /api/v1/sales` (Sales history and pagination).
- [x] `GET /api/v1/sales/:id` & `GET /api/v1/sales/invoice/:invoiceNumber` (Full receipt itemization).
- [x] `GET /api/v1/sales/summary/today` (Cash drawer daily reconciliation powered by Day.js).
- [x] Automated test suites verified (12/12 test cases passed 100%).

---

### Day 2: 18 October 2026 (Frontend Terminal, AI Feature & Testing)

#### [09:00 – 13:00] Phase 4: POS Terminal (Next.js 16 + React 19 + Tailwind CSS)
- [x] Configure Next.js frontend with Tailwind CSS and Lucide icons on port 3001.
- [x] Build POS Terminal UI (`client/components/pos/pos-terminal.tsx`):
  - [x] Header with cashier badge, live digital clock, and shift stats (today's revenue, transactions count).
  - [x] Left panel: Category button pills, live search bar (by name, SKU, barcode), and responsive product cards with stock badges.
  - [x] Right panel: Sticky Cart drawer with quantity steppers (+ / -), discount input, tax rate, and total calculation.
- [x] Barcode Scanner listener (captures scanner inputs ending with `Enter` and auto-adds to cart).
- [x] User Feedback: Skeleton loaders, empty states, out-of-stock disable indicators, error toasts.

#### [14:00 – 17:30] Phase 5: Cash Payment Modal & Receipt Generator
- [x] Cash Checkout Modal (`client/components/pos/cash-payment-modal.tsx`):
  - [x] Large total payable display.
  - [x] Quick Tender buttons (`Exact`, `$10`, `$20`, `$50`, `$100`, `$200`).
  - [x] Real-time `Change Due` / shortage calculator.
  - [x] Prevents checkout if `amountTendered < total`.
- [x] Printable Receipt (`client/components/pos/receipt-modal.tsx`):
  - [x] Clean thermal-receipt preview formatted for 80mm roll with dedicated `@media print` CSS (`window.print()`).
  - [x] Itemized breakdown, invoice number, store header, tender, and change due.

#### [18:30 – 21:30] Phase 6: AI Feature Integration (Gemini API)
- [x] Backend routes: `GET /api/v1/ai/sales-insights` and `POST /api/v1/ai/sales-insights`.
- [x] Fetch current low-stock products and sales totals $\rightarrow$ Prompt Google Gemini API (gemini-1.5-flash).
- [x] Built-in Deterministic Heuristic Fallback Engine ensuring 100% demo uptime without external key dependency.
- [x] AI generates:
  - [x] Executive Shift Summary & Inventory Health Score.
  - [x] Top-selling velocity movers with revenue contribution percentages.
  - [x] Urgent restock alerts for items near zero with recommended order quantities.
  - [x] Actionable store operation recommendations checklist.
- [x] Frontend AI Copilot Modal (`client/components/pos/ai-insights-modal.tsx`) with pulse alert and 1-click clipboard export.

#### [21:30 – 23:30] Phase 7: Automated Unit Tests
- [ ] 3-4 Unit tests (Vitest):
  1. Cash change calculation logic with various denominations.
  2. Inventory stock validation and insufficient stock rollback.
  3. Tax and total calculations.

---

### Day 3: 19 October 2026 (Documentation, Demo Walkthrough & Review Prep)

#### [09:00 – 13:00] Phase 8: Local Setup Verification & README
- [ ] Complete `README.md` with 2-step setup:
  1. `docker compose up -d` (starts PostgreSQL)
  2. `npm run dev` (starts backend and frontend)
  3. Demo credentials: `admin@pos.local` / `cashier@pos.local`
- [ ] Provide `.env.example`.
- [ ] Test the entire flow from clean clone to running application.

#### [13:00 – 17:00] Phase 9: Live Demo Rehearsal & Defense
- [ ] Rehearse walkthrough: Login $\rightarrow$ Product search/scan $\rightarrow$ Cart $\rightarrow$ Cash tender & change $\rightarrow$ Print receipt $\rightarrow$ AI Insights.
- [ ] Prepare for live code questions and live tweaks (e.g. changing tax rate, adding a field, explaining TypeORM transactions).

---

## 5. Immediate Next Step
Ready to begin **Phase 1: Project Scaffolding & PostgreSQL + TypeORM Setup**.
