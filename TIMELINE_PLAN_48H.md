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
- [ ] Create `docker-compose.yml` for local PostgreSQL (port 5432) + `.env.example`.
- [ ] Initialize `backend/` with Express, TypeScript, TypeORM, and pg driver.
- [ ] Configure `data-source.ts` connecting to PostgreSQL.
- [ ] Implement Entities: `User`, `Category`, `Product`, `Sale`, `SaleItem`.
- [ ] Write seed script `seed.ts` populating categories, users (Admin/Cashier), and sample retail products with barcodes.

#### [18:30 – 21:00] Phase 2: Auth, Security & Product Management APIs
- [ ] JWT authentication (`/api/auth/login`, `/api/auth/me`).
- [ ] Zod schema validation middleware.
- [ ] Product & Category APIs:
  - `GET /api/products` (Search & category filter)
  - `GET /api/products/barcode/:barcode` (Instant barcode scanner lookup)
  - `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (Admin only)

#### [21:00 – 23:30] Phase 3: Cash Checkout Engine & Transactional Logic
- [ ] `POST /api/sales/checkout` with TypeORM `transaction`:
  - Verify stock availability.
  - Atomic stock decrement (`stock_quantity = stock_quantity - qty`).
  - Calculate `total` and `change_due = amount_tendered - total`.
  - Validate `amount_tendered >= total`.
  - Insert `Sale` and `SaleItems`.
- [ ] `GET /api/sales` (Sales history and re-print receipts).

---

### Day 2: 18 October 2026 (Frontend Terminal, AI Feature & Testing)

#### [09:00 – 13:00] Phase 4: POS Terminal (React + Vite + Tailwind CSS)
- [ ] Initialize `frontend/` with Vite, React, TypeScript, and Tailwind CSS.
- [ ] Build POS Terminal UI:
  - Header with cashier badge, live clock, and quick stats.
  - Left panel: Category buttons, live search bar, and responsive product cards with stock badges.
  - Right panel: Sticky Cart drawer with quantity adjusters (+ / -), discounts, and total breakdown.
- [ ] Barcode Scanner listener (captures rapid keyboard inputs ending with `Enter`).
- [ ] User Feedback: Skeleton loaders, empty states, out-of-stock disable indicators, error toasts.

#### [14:00 – 17:30] Phase 5: Cash Payment Modal & Receipt Generator
- [ ] Cash Checkout Modal:
  - Large total payable display.
  - Quick Tender buttons (`Exact`, `$10`, `$20`, `$50`, `$100`).
  - Real-time `Change Due` calculator.
  - Prevents checkout if `amount_tendered < total`.
- [ ] Printable Receipt:
  - Clean thermal-receipt preview formatted for 80mm roll (`window.print()`).
  - Itemized breakdown, invoice number, store header, tender, and change due.

#### [18:30 – 21:30] Phase 6: AI Feature Integration (Gemini API)
- [ ] Backend route: `POST /api/ai/sales-insights`.
- [ ] Fetch current low-stock products and sales totals $\rightarrow$ Prompt Google Gemini API.
- [ ] AI generates:
  - Top-selling trends.
  - Urgent restock alerts for items near zero.
  - Actionable advice for the store manager.
- [ ] Frontend AI Insights Modal with 1-click generation and markdown display.

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
