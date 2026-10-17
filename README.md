# Retail Point of Sale (POS) System with Cash Engine & AI Insights

> **Assessment Submission:** NT Tech Innovation — Full Stack Developer Practical Assessment  
> **Submission Deadline:** 19 October 2026  
> **Live Local URL:** `http://localhost:3001` (Frontend) | `http://localhost:3900` (Backend API)  
> **Swagger API Docs:** `http://localhost:3900/api/docs`

---

## 1. Project Overview & Business Problem

In fast-paced retail environments (supermarkets, apparel stores, corner retail shops), cash transactions and stock mismanagement often lead to discrepancies, slow checkout lines, and unexpected stockouts. 

This project is a **production-ready, full-stack Point of Sale (POS) application** engineered to solve these operational pain points:
- **Instant Cash Checkout:** Validates tendered amount, auto-calculates change due, and records immutable sales records.
- **Atomic Stock Control:** Concurrency-safe, transactional decrement prevents overselling even with multiple active cashier terminals.
- **AI-Powered Store Copilot:** Utilizes the Google Gemini AI model to analyze sales velocity and stock levels, providing automated restock advisories and executive summaries.
- **Role-Based Access Control (RBAC):** Strict segregation between Store Admins (catalog & analytics) and Terminal Cashiers (checkout & receipts).

---

## 2. Technology Stack

| Layer | Technologies Used | Rationale |
| :--- | :--- | :--- |
| **Backend** | NestJS, TypeScript, Node.js | Enterprise-grade modular architecture with dependency injection and strong typing. |
| **ORM & Database** | TypeORM, PostgreSQL 17 | Type-safe entity modeling, automatic schema synchronization, transactional isolation. |
| **Authentication** | Passport.js, JWT, Bcrypt | Stateless JWT authentication, role guards (`Admin`, `Cashier`), bcrypt password hashing. |
| **API Documentation** | Swagger / OpenAPI (`/api/docs`) | Interactive API exploration and testing. |
| **Frontend** | Next.js (App Router), React, TypeScript | Fast server-side rendering and client-side terminal reactivity. |
| **Styling & UI** | Tailwind CSS, Lucide Icons | Clean, responsive POS terminal layout with zero runtime CSS overhead. |
| **Form & State** | Zod, React Query (TanStack Query) | Strict input validation, optimistic UI updates, and cached API requests. |
| **AI Integration** | Google Gemini API | Automated sales pattern analysis and restock forecasting. |
| **Containerization** | Docker, Docker Compose | 1-command reproducible local environment. |

---

## 3. System Architecture & Database Schema

### Entity Relationship Model

```mermaid
erDiagram
    USERS ||--o{ SALES : "processed_by (cashier)"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ SALE_ITEMS : "referenced_in"
    SALES ||--|{ SALE_ITEMS : "has_line_items"

    USERS {
        uuid id PK
        string name
        string email UK
        string username UK
        string password
        enum roles "Admin, Cashier"
        enum status "Active, Inactive"
        timestamp createdAt
    }

    CATEGORIES {
        uuid id PK
        string name UK
        string description
        timestamp createdAt
    }

    PRODUCTS {
        uuid id PK
        uuid categoryId FK
        string name
        string sku UK
        string barcode UK
        decimal retailPrice
        decimal costPrice
        int stockQuantity
        int lowStockThreshold
        boolean isActive
        timestamp createdAt
    }

    SALES {
        uuid id PK
        string invoiceNumber UK
        uuid cashierId FK
        string customerName
        decimal subtotal
        decimal discount
        decimal tax
        decimal total
        decimal amountTendered
        decimal changeDue
        string paymentMethod "CASH"
        timestamp createdAt
    }

    SALE_ITEMS {
        uuid id PK
        uuid saleId FK
        uuid productId FK
        string productName
        string sku
        decimal unitPrice
        decimal unitCost
        int quantity
        decimal totalPrice
    }
```

---

## 4. Module Documentation Directory

- 📖 [User & Authentication Module Documentation](file:///media/gowtamkumar/ba015ba5-d67a-4dd3-a76f-71a0b397e4042/projects/pos/doc/USER_MODULE.md) — RBAC, Bcrypt security, JWT authentication, and endpoints.
- 📖 [Category Module Documentation](file:///media/gowtamkumar/ba015ba5-d67a-4dd3-a76f-71a0b397e4042/projects/pos/doc/CATEGORY_MODULE.md) — Retail departments, auto-slugification, POS quick active tabs, and CRUD.
- 📖 Product Catalog & Inventory Module *(coming next)*
- 📖 Sales & Cash Checkout Ledger *(coming next)*

---

## 5. Demo Login Credentials

The database comes pre-seeded with sample users for evaluation:

| Role | Name | Email | Username | Password | Access Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Store Admin** | Store Admin | `admin@pos.local` | `admin` | `Admin@1234` | Full access (Products, Categories, Sales Analytics, User Management). |
| **Terminal Cashier** | Terminal Cashier | `cashier@pos.local` | `cashier` | `Cashier@1234` | POS Terminal, Barcode Scanning, Cash Checkout, Print Receipts. |

---

## 6. Quick Start & Setup Guide (A to Z)

You can run the entire application either using **Docker Compose (Recommended)** or **Direct Local Node.js**.

### Method A: 1-Command Startup via Docker Compose (Recommended)

#### 1. Prerequisites
- Docker & Docker Compose installed.

#### 2. Start Services
From the project root directory, run:
```bash
docker compose -f docker-compose.dev.yml up -d
```
*This starts:*
- PostgreSQL on port `5543` (internal `5432`)
- pgAdmin on port `5050` (`http://localhost:5050`)
- Backend API on port `3900` (`http://localhost:3900`)
- Frontend Web App on port `3001` (`http://localhost:3001`)

#### 3. Run Database Seed
Seed the default Admin and Cashier accounts into PostgreSQL:
```bash
docker exec pos_dev_server_app npm run seed
```

#### 4. Access the Application
- **Frontend App:** [http://localhost:3001](http://localhost:3001)
- **Login Screen:** [http://localhost:3001/login](http://localhost:3001/login)
- **Backend API Docs (Swagger):** [http://localhost:3900/api/docs](http://localhost:3900/api/docs)
- **pgAdmin (Optional):** [http://localhost:5050](http://localhost:5050) (User: `gowtam.semicolonit@gmail.com`, Pass: `pos@`)

---

### Method B: Manual Local Setup (Host Node.js)

#### 1. Prerequisites
- Node.js v20+ / v24+
- PostgreSQL database running (e.g. via Docker `docker compose -f docker-compose.dev.yml up -d postgres`)

#### 2. Configure Environment Variables

**Backend (`server/.env.development`):**
```env
NODE_ENV=development
API_PORT=3900
FRONTEND_URL=http://localhost:3001

JWT_SECRET_KEY=pos_jwt_secret_super_secure_key_2026
JWT_EXPIRES=7d

DB_HOST=localhost
DB_PORT=5543
DB_USERNAME=pos
DB_PASSWORD=pos@
DB_DATABASE=pos
DB_SYNCHRONIZE=true
DB_MIGRATIONS_RUN=false
ENABLE_ORM_LOGS=false

GEMINI_API_KEY=your_gemini_api_key_here
```

**Frontend (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3900/api/v1
PORT=3001
```

#### 3. Install Dependencies & Build
```bash
# 1. Setup Backend
cd server
npm install
npm run seed     # Seeds Admin and Cashier
npm run start:dev # Starts backend on port 3900

# 2. Setup Frontend (in a new terminal)
cd ../client
npm install
npm run dev      # Starts Next.js on port 3001
```

---

## 7. Key API Endpoints

All endpoints are prefixed with `/api/v1`. Live interactive testing is available at `http://localhost:3900/api/docs`.

### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and issues JWT token in response & HTTP cookie. |
| `POST` | `/api/v1/auth/register` | Public | Registers a new Cashier user account. |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieves current authenticated session and profile details. |
| `POST` | `/api/v1/auth/refresh` | Authenticated | Refreshes active JWT session token. |
| `DELETE` | `/api/v1/auth/logout` | Authenticated | Clears authorization cookies and session. |

### Users (`/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Admin | Paginated list of users with search and filter capabilities. |
| `POST` | `/api/v1/users` | Admin | Manually creates a user with designated role (`Admin` or `Cashier`). |
| `PUT` | `/api/v1/users/:id` | Admin | Updates user name, status, or role. |
| `PATCH` | `/api/v1/users/update-password/:id` | Admin | Resets a user password securely. |
| `DELETE` | `/api/v1/users/:id` | Admin | Removes user record from database. |

### Products & Inventory (`/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Cashier / Admin | Searches products by title, category, or barcode. |
| `GET` | `/api/v1/products/barcode/:barcode` | Cashier / Admin | Instant product lookup for USB/Bluetooth barcode scanner. |
| `POST` | `/api/v1/products` | Admin | Adds a new product with retail price, cost price, and initial stock. |
| `PUT` | `/api/v1/products/:id` | Admin | Updates pricing, stock quantity, or low-stock thresholds. |

### Sales & Cash Checkout (`/sales`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sales/checkout` | Cashier / Admin | **Atomic Transaction:** Validates cash tendered $\ge$ total, calculates change due, decrements inventory stock, and logs immutable sale. |
| `GET` | `/api/v1/sales` | Cashier / Admin | Lists transaction history with printable receipt re-generation. |
| `GET` | `/api/v1/sales/:id` | Cashier / Admin | Retrieves itemized receipt breakdown for a specific sale. |

### AI Store Copilot (`/ai`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/sales-insights` | Admin | Collects sales totals and low-stock items to generate Gemini-powered restock recommendations. |

### Module Deep-Dive Documentation
- 📘 [User & Auth Module Documentation](doc/USER_MODULE.md) — Authentication flow, password policies, user CRUD & 10 automated test suites.
- 📁 [Category Module Documentation](doc/CATEGORY_MODULE.md) — Category department hierarchy, auto-slugification, RBAC & test suites.
- 📦 [Product Module Documentation](doc/PRODUCT_MODULE.md) — Direct product architecture, instant barcode scanning, low-stock alerts, atomic stock adjustments & test suites.

---

## 8. AI / ML Feature Details (Assessment Criterion 5)

As required by the practical assessment specifications, this application includes an integrated AI copilot:

1. **Model:** Google Gemini API (`gemini-1.5-flash` / `gemini-pro`).
2. **Inputs:**
   - Real-time catalog stock counts (`stock_quantity`, `low_stock_threshold`).
   - Daily transaction aggregates (revenue, units sold per product, top velocity items).
3. **Outputs:**
   - Automated restock priority list (flagging items expected to stock out within 24–48 hours).
   - Executive sales summary formatted in Markdown for store managers.
4. **How It Was Evaluated:**
   - Tested against edge cases: zero sales, negative stock safety checks, and high-frequency transactions.
   - Constrained prompts prevent hallucinations and ensure strict JSON/Markdown output formatting.
5. **Known Limitations:**
   - Depends on external internet connection to reach Google AI servers; if offline, fallback heuristic low-stock alerts are triggered automatically.

---

## 9. Technical Decisions & Live Review Defense

When reviewing the code or performing live modifications during technical review:

### 1. Concurrency Control on Variant Inventory
- **Problem:** Two cashiers scanning the last item simultaneously could result in negative stock.
- **Solution:** We use TypeORM's `EntityManager.transaction()` with atomic conditional decrement:
  ```sql
  UPDATE products
  SET stock_quantity = stock_quantity - :qty
  WHERE id = :id AND stock_quantity >= :qty;
  ```
  If zero rows are updated, the transaction automatically rolls back and returns an `INSUFFICIENT_STOCK` HTTP 400 error.

### 2. Financial Ledger Immutability
- Line items are stored as independent static snapshots in `sale_items` at the moment of sale (`unit_price`, `unit_cost`, `product_name`).
- Future edits to product names or catalog prices will never corrupt historical receipts or accounting totals.

---

## 10. Testing & Quality Assurance

To execute automated test suites on core business calculations (cash change due, stock decrements, tax precision):
```bash
cd server
npm test
```

---

## 11. Verification Checklist

- [x] Backend TypeORM Entities & PostgreSQL integration.
- [x] Seed script populated with Admin (`admin@pos.local`), Cashier (`cashier@pos.local`), 5 categories, and 10 products with barcodes.
- [x] JWT Authentication & Protected endpoints verified via Swagger & curl.
- [x] User Module verified with 10 automated end-to-end tests ([USER_MODULE.md](doc/USER_MODULE.md)).
- [x] Category Module verified with 9 automated end-to-end tests ([CATEGORY_MODULE.md](doc/CATEGORY_MODULE.md)).
- [x] Product Module verified with 10 automated end-to-end tests ([PRODUCT_MODULE.md](doc/PRODUCT_MODULE.md)).
- [x] Client login page connected to backend auth with role redirection.
- [x] Ready to run locally with 1-command Docker Compose (`docker compose -f docker-compose.dev.yml up -d`).