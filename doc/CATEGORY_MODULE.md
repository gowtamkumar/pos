# Category Module Documentation

> **System:** Retail Point of Sale (POS) Backend  
> **Module Path:** `server/src/modules/category`  
> **Database Table:** `categories` (PostgreSQL)  
> **API Base Prefix:** `/api/v1`  
> **Interactive Swagger Docs:** `http://localhost:3900/api/docs`

---

## 1. Overview & Role in Retail POS

In a retail Point of Sale system, **Categories** organize inventory items into logical departments (e.g. *Beverages, Snacks & Bakery, Grocery & Staples, Dairy & Eggs*). 

This module provides:
- **Fast POS Catalog Filtering:** A high-speed endpoint (`GET /categories/active`) designed specifically for terminal category tabs, allowing cashiers to quickly filter items with one tap.
- **Auto-Slugification:** Converts category names to URL-safe slugs (e.g., "Frozen Foods & Meals" $\rightarrow$ `frozen-foods-meals`).
- **RBAC Governance:** Store Admins have full CRUD authority; Terminal Cashiers can view and filter active categories during checkout.
- **Conflict Prevention:** Enforces unique constraint validation on both category names and slugs with descriptive `409 Conflict` errors.

---

## 2. File & Directory Structure

```
server/src/modules/category/
├── controllers/
│   └── category.controller.ts      # REST API endpoints & Swagger documentation
├── dtos/
│   ├── create-category.dto.ts      # Validation schema for new category creation
│   ├── update-category.dto.ts      # Optional partial update schema
│   ├── filter-category.dto.ts      # Search & pagination filter parameters
│   └── index.ts                    # DTO export barrel
├── entities/
│   └── category.entity.ts          # TypeORM entity for PostgreSQL 'categories' table
├── services/
│   └── category.service.ts         # Business logic, slug generation, duplicate guards
└── category.module.ts              # NestJS module definition with TypeORM repository
```

---

## 3. Database Schema (`categories` table)

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique category identifier generated automatically. |
| `name` | `VARCHAR` | `NOT NULL, UNIQUE` | Department/Category title (e.g., "Beverages"). |
| `slug` | `VARCHAR` | `NOT NULL, UNIQUE` | Clean URL-friendly identifier. |
| `description` | `TEXT` | `NULLABLE` | Detailed description of the category. |
| `isActive` | `BOOLEAN` | `DEFAULT TRUE` | Controls whether the category appears on the POS terminal. |
| `createdAt` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Record creation timestamp. |
| `updatedAt` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Last update timestamp. |

### Indexes
- `idx_categories_name` on `name` (B-Tree)
- `idx_categories_slug` on `slug` (B-Tree)

---

## 4. Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Route | Admin Access | Cashier Access | Description |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **List Categories** | `GET` | `/api/v1/categories` | ✅ Allowed | ✅ Allowed | Paginated list with search & active filter. |
| **Get Active Categories**| `GET`| `/api/v1/categories/active` | ✅ Allowed | ✅ Allowed | Unpaginated active list for POS terminal tabs. |
| **Get Category by ID**| `GET` | `/api/v1/categories/:id` | ✅ Allowed | ✅ Allowed | Detailed category view. |
| **Create Category** | `POST` | `/api/v1/categories` | ✅ Allowed | ❌ **403 Forbidden** | Add new category department. |
| **Update Category** | `PUT` | `/api/v1/categories/:id` | ✅ Allowed | ❌ **403 Forbidden** | Modify name, slug, or active status. |
| **Delete Category** | `DELETE`| `/api/v1/categories/:id` | ✅ Allowed | ❌ **403 Forbidden** | Remove category from catalog. |

---

## 5. API Endpoints & Request/Response Samples

### 1. Get Active Categories for POS Terminal
- **Endpoint:** `GET /api/v1/categories/active`
- **Headers:** `Authorization: Bearer <TOKEN>` (Cashier or Admin)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Active categories retrieved",
    "data": [
      {
        "id": "7a35e406-8c43-4318-8f83-e022f4682c35",
        "name": "Beverages",
        "slug": "beverages",
        "description": "Cold drinks, sodas, mineral water & fresh juices",
        "isActive": true
      },
      {
        "id": "e41f0a25-2efc-4e89-8d19-4b68494c8b21",
        "name": "Snacks & Bakery",
        "slug": "snacks-bakery",
        "description": "Chips, biscuits, cookies, fresh bread & confectionery",
        "isActive": true
      }
    ]
  }
  ```

---

### 2. Create Category (Admin Only)
- **Endpoint:** `POST /api/v1/categories`
- **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
- **Request Body:**
  ```json
  {
    "name": "Frozen Foods",
    "description": "Ice creams, frozen meat & ready-to-cook items"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Category created successfully",
    "data": {
      "id": "2bc8e612-4f91-4d11-b021-9d87e1482f34",
      "name": "Frozen Foods",
      "slug": "frozen-foods",
      "description": "Ice creams, frozen meat & ready-to-cook items",
      "isActive": true
    }
  }
  ```

---

### 3. Duplicate Prevention (Conflict Guard)
- **Trigger:** Calling `POST /api/v1/categories` with an existing category name or slug.
- **Response (`409 Conflict`):**
  ```json
  {
    "statusCode": 409,
    "message": "Category name 'Frozen Foods' already exists",
    "error": "Conflict"
  }
  ```

---

### 4. Update Category (Admin Only)
- **Endpoint:** `PUT /api/v1/categories/:id`
- **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
- **Request Body:**
  ```json
  {
    "name": "Frozen Foods & Meals",
    "description": "Updated ready meals and ice cream"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Category updated successfully",
    "data": {
      "id": "2bc8e612-4f91-4d11-b021-9d87e1482f34",
      "name": "Frozen Foods & Meals",
      "slug": "frozen-foods-meals",
      "description": "Updated ready meals and ice cream",
      "isActive": true
    }
  }
  ```

---

### 5. Delete Category (Admin Only)
- **Endpoint:** `DELETE /api/v1/categories/:id`
- **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Category deleted successfully",
    "data": {
      "id": "2bc8e612-4f91-4d11-b021-9d87e1482f34",
      "name": "Frozen Foods & Meals"
    }
  }
  ```

---

## 6. Pre-seeded Retail Categories

The seed script (`npm run seed`) automatically seeds 5 standard retail departments:

1. **Beverages** (`slug: beverages`)
2. **Snacks & Bakery** (`slug: snacks-bakery`)
3. **Grocery & Staples** (`slug: grocery-staples`)
4. **Dairy & Eggs** (`slug: dairy-eggs`)
5. **Personal Care** (`slug: personal-care`)

