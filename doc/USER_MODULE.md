# User & Authentication Module Documentation

> **System:** Retail Point of Sale (POS) Backend  
> **Module Path:** `server/src/modules/admin/user` & `server/src/modules/admin/auth`  
> **Database Table:** `users` (PostgreSQL)  
> **API Base Prefix:** `/api/v1`  
> **Interactive Swagger Docs:** `http://localhost:3900/api/docs`

---

## 1. Overview & Business Purpose

In a Point of Sale (POS) system, secure user and staff management is critical to ensure **financial accountability**, prevent unauthorized cash adjustments, and maintain a clear audit trail of who conducted each sale.

The User Module provides:
- **Role-Based Access Control (RBAC):** Strict boundaries separating **Store Admins** (catalog managers, user provisioning, reports) from **Terminal Cashiers** (restricted to scanning products and processing payments).
- **Stateless Authentication:** JSON Web Token (JWT) architecture with HTTP cookies and Bearer tokens.
- **Enterprise Security:** Industry-standard password hashing using **Bcrypt** (10 salt rounds), self-account deletion protection, and duplicate identifier conflict prevention.

---

## 2. File & Directory Structure

```
server/src/modules/admin/user/
├── controllers/
│   └── user.controller.ts       # Route endpoints, Swagger tags, and Guard bindings
├── dtos/
│   ├── create-user.dto.ts       # Validation schema for user creation
│   ├── filter-user.dto.ts       # Query parameter filters (search, role, pagination)
│   ├── update-user.dto.ts       # Validation schema for partial profile updates
│   ├── update-password.dto.ts   # Secure password update payload
│   ├── user.dto.ts              # Transferred user object
│   ├── user-response.dto.ts     # User serialization response
│   └── index.ts                 # DTO export barrel
├── entities/
│   └── user.entity.ts           # TypeORM PostgreSQL entity definition
├── enums/
│   ├── user-role.enum.ts        # Allowed roles: Admin, Cashier
│   └── user-status.enum.ts      # Account status: Active, Inactive, Blocked
├── services/
│   └── user.service.ts          # Core business logic & database repository calls
└── user.module.ts               # NestJS module definition with TypeORM repository
```

---

## 3. Database Schema (`users` table)

The PostgreSQL table is managed by TypeORM with automatic synchronization:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Unique identifier generated via `uuid_generate_v4()`. |
| `name` | `VARCHAR` | `NOT NULL` | Full display name of the staff member. |
| `username` | `VARCHAR` | `NOT NULL, UNIQUE` | Unique handle for login credentials. |
| `email` | `VARCHAR` | `NULLABLE, UNIQUE` | Staff email for correspondence and login. |
| `password` | `VARCHAR` | `NULLABLE` | Bcrypt hashed password (never stored as plain text). |
| `isAdmin` | `BOOLEAN` | `DEFAULT FALSE` | Fast-path boolean flag for superadmin authorization. |
| `roles` | `ENUM[]` | `DEFAULT ['Cashier']` | Array of roles (`UserRole.Admin`, `UserRole.Cashier`). |
| `status` | `ENUM` | `DEFAULT 'Active'` | Staff status (`Active`, `Inactive`, `Blocked`). |
| `avatarUrl` | `TEXT` | `NULLABLE` | Optional profile image link. |
| `createdAt` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Timestamp when staff member was enrolled. |
| `updatedAt` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Timestamp of last profile update. |

### Database Indexes
- `idx_users_username` on column `username` (B-Tree)
- `idx_users_email` on column `email` (B-Tree)
- `idx_users_status` on column `status` (B-Tree)

---

## 4. Role-Based Access Control (RBAC) Matrix

| Action / Endpoint | Method | Route | Admin Access | Cashier Access |
| :--- | :---: | :--- | :---: | :---: |
| **Login** | `POST` | `/api/v1/auth/login` | ✅ Allowed | ✅ Allowed |
| **Get Current Profile** | `GET` | `/api/v1/auth/me` | ✅ Allowed | ✅ Allowed |
| **Refresh Token** | `POST` | `/api/v1/auth/refresh` | ✅ Allowed | ✅ Allowed |
| **Logout** | `DELETE` | `/api/v1/auth/logout` | ✅ Allowed | ✅ Allowed |
| **List All Users** | `GET` | `/api/v1/users` | ✅ Allowed | ❌ **403 Forbidden** |
| **Get User by ID** | `GET` | `/api/v1/users/:id` | ✅ Allowed | ❌ **403 Forbidden** |
| **Create New User** | `POST` | `/api/v1/users` | ✅ Allowed | ❌ **403 Forbidden** |
| **Update User Details**| `PUT` | `/api/v1/users/:id` | ✅ Allowed | ❌ **403 Forbidden** |
| **Change Password** | `PATCH` | `/api/v1/users/update-password/:id` | ✅ Allowed | ✅ Allowed (Own ID) |
| **Delete User** | `DELETE` | `/api/v1/users/:id` | ✅ Allowed | ❌ **403 Forbidden** |

---

## 5. API Endpoints & Request/Response Samples

### 1. User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:**
  ```json
  {
    "credential": "admin@pos.local",
    "password": "Admin@1234"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Login successfull",
    "data": {
      "user": {
        "id": "8826291a-918b-4c69-ab14-fd7a6aaf1de5",
        "name": "Store Admin",
        "email": "admin@pos.local",
        "username": "admin",
        "isAdmin": true,
        "roles": ["Admin"],
        "status": "Active"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### 2. List All Users (Admin Only)
- **Endpoint:** `GET /api/v1/users?page=1&limit=10&search=cashier`
- **Headers:** `Authorization: Bearer <ADMIN_JWT>`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "List of users",
    "data": {
      "data": [
        {
          "id": "3e1970c7-a1e6-43a8-b20f-256396ffdd4e",
          "name": "Terminal Cashier",
          "email": "cashier@pos.local",
          "username": "cashier",
          "isAdmin": false,
          "roles": ["Cashier"],
          "status": "Active"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```
- *Note: Passwords are automatically excluded from the query projection.*

---

### 3. Create a New User (Admin Only)
- **Endpoint:** `POST /api/v1/users`
- **Headers:** `Authorization: Bearer <ADMIN_JWT>`
- **Request Body:**
  ```json
  {
    "name": "John Cashier",
    "username": "john_pos",
    "email": "john@pos.local",
    "password": "Cashier@1234",
    "roles": ["Cashier"]
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "New user created successfully",
    "data": {
      "id": "d678ae2a-6f82-4936-af07-f01dd7d4b027",
      "name": "John Cashier",
      "username": "john_pos",
      "email": "john@pos.local",
      "roles": ["Cashier"],
      "isAdmin": false,
      "status": "Active"
    }
  }
  ```

---

### 4. Duplicate Identifier Conflict
- **Trigger:** Calling `POST /api/v1/users` with an already registered `username` or `email`.
- **Response (`409 Conflict`):**
  ```json
  {
    "statusCode": 409,
    "message": "Username 'john_pos' is already in use",
    "error": "Conflict"
  }
  ```

---

### 5. Update User Profile (Admin Only)
- **Endpoint:** `PUT /api/v1/users/:id`
- **Headers:** `Authorization: Bearer <ADMIN_JWT>`
- **Request Body:**
  ```json
  {
    "name": "John Cashier Senior",
    "status": "Active",
    "roles": ["Cashier"]
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User updated successfully",
    "data": {
      "id": "d678ae2a-6f82-4936-af07-f01dd7d4b027",
      "name": "John Cashier Senior",
      "status": "Active"
    }
  }
  ```

---

### 6. Update Password
- **Endpoint:** `PATCH /api/v1/users/update-password/:id`
- **Headers:** `Authorization: Bearer <JWT>`
- **Request Body:**
  ```json
  {
    "currentPassword": "Cashier@1234",
    "newPassword": "NewStrongPassword@2026"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Password updated successfully"
  }
  ```

---

### 7. Self-Delete Prevention (Security Guard)
- **Trigger:** An authenticated Administrator attempting to delete their own account (`DELETE /api/v1/users/<MY_OWN_ID>`).
- **Response (`400 Bad Request`):**
  ```json
  {
    "statusCode": 400,
    "message": "Security violation: You cannot delete your own account",
    "error": "Bad Request"
  }
  ```

---

### 8. Delete User (Admin Only)
- **Endpoint:** `DELETE /api/v1/users/:id`
- **Headers:** `Authorization: Bearer <ADMIN_JWT>`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User deleted successfully",
    "data": {
      "id": "d678ae2a-6f82-4936-af07-f01dd7d4b027",
      "name": "John Cashier Senior"
    }
  }
  ```

---

## 6. Security & Engineering Highlights

1. **Password Safety:**
   - Hashed using `bcrypt.hash(password, 10)` before storage.
   - Raw SQL selects explicitly omit the `password` field from output queries using `qb.select(...)`.
   - Any returned user entity object runs `delete user.password` as defense-in-depth.

2. **Guards & Interceptors:**
   - `JwtAuthGuard`: Validates the bearer token or HTTP cookie from request headers.
   - `RolesGuard`: Inspects route metadata set by `@Roles(UserRole.Admin)` and rejects non-admin callers with `403 Forbidden`.

3. **Input Validation:**
   - Managed via `class-validator` and `class-transformer` inside global `ValidationPipe`.
   - Automatically sanitizes incoming payloads and strips untrusted fields (`whitelist: true`).

---

## 7. Verification Test Suite Results

The User Module was validated end-to-end with 10 automated test suites:

```
=== 1. Login as Admin ===
Status: 200 | Token acquired: true

=== 2. GET /api/v1/users (Admin Listing) ===
Status: 200 | Count returned: 2

=== 3. POST /api/v1/users (Admin Create New Cashier) ===
Status: 201 | Created User ID: d678ae2a-6f82-4936-af07-f01dd7d4b027

=== 4. Duplicate Check (POST with duplicate username) ===
Status: 409 Conflict | Message: Username is already in use

=== 5. GET /api/v1/users/:id ===
Status: 200 | Fetched User Name: Alex Cashier

=== 6. PUT /api/v1/users/:id (Update Name & Status) ===
Status: 200 | Updated Name: Alex Johnson (Updated)

=== 7. PATCH /api/v1/users/update-password/:id ===
Status: 200 | Password updated successfully

=== 8. RBAC Test: Cashier trying to access Admin-only GET /api/v1/users ===
Status: 403 Forbidden | Message: Access denied. Required role: Admin

=== 9. Self-Delete Protection: Admin trying to delete self ===
Status: 400 Bad Request | Message: Security violation: You cannot delete your own account

=== 10. DELETE /api/v1/users/:id (Admin deletes test cashier) ===
Status: 200 | Deleted User: Alex Johnson (Updated)

🎉 ALL 10 TESTS PASSED 100% SUCCESSFULLY!
```

