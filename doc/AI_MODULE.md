# AI Sales Copilot & Restock Insights Engine

## 1. Overview
The **AI Sales Copilot & Restock Insights Engine** fulfills Phase 6 of the Retail POS system. It analyzes store sales velocity and real-time inventory levels to generate calendar-day sales summaries and recommend inventory replenishment orders using stock thresholds. Reorder quantities are deterministic rules, not demand forecasts.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────┐
│     POS Terminal Frontend       │
│  (AI Copilot Interactive Modal) │
└────────────────┬────────────────┘
                 │ POST /api/v1/ai/sales-insights
                 ▼
┌─────────────────────────────────┐
│       NestJS AiController       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│           AiService             │
└────────┬───────────────┬────────┘
         │               │
         ▼               ▼
┌─────────────────┐  ┌──────────────────────────────────────┐
│  TypeORM Repos  │  │      Google Gemini API Engine        │
│  - SaleEntity   │  │       (Google Gen AI SDK)             │
│  - SaleItem     │  │  Prompt: Retail Operations Consultant│
│  - Product      │  └──────────────────┬───────────────────┘
└─────────────────┘                     │
                                        │ (Fallback on errors or missing key)
                                        ▼
                             ┌───────────────────────┐
                             │  Deterministic Rules  │
                             │   Heuristic Fallback  │
                             └───────────────────────┘
```

---

## 3. Endpoints

### `POST /api/v1/ai/sales-insights`
- **Authentication:** Bearer JWT (`Admin` or `Cashier` role).
- **Query Parameters:**
  - `days` (optional, integer, default: `1`): Calendar days including today, from midnight in `STORE_TIMEZONE` through the request time. Allowed range: 1–30. With `days=1`, only today is included; this is not a cashier shift report.

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "AI sales insights generated successfully",
  "data": {
    "executiveSummary": "Today generated $427.88 across 6 transactions (Avg ticket: $71.31). Attention needed: 2 item(s) are below safety stock levels, with an inventory health rating of 85%.",
    "inventoryHealthScore": 85,
    "totalRevenue": 427.88,
    "totalTransactions": 6,
    "averageOrderValue": 71.31,
    "urgentRestock": [
      {
        "productName": "Fresh Whole Milk 1L",
        "sku": "DRY-MILK-1L",
        "currentStock": 4,
        "threshold": 10,
        "recommendedOrderQty": 36,
        "urgency": "HIGH",
        "reasoning": "Stock level (4) is below safety threshold (10). Reorder soon to prevent stockouts."
      },
      {
        "productName": "Farm Fresh Brown Eggs (Dozen)",
        "sku": "DRY-EGGS-12",
        "currentStock": 3,
        "threshold": 8,
        "recommendedOrderQty": 29,
        "urgency": "HIGH",
        "reasoning": "Stock level (3) is below safety threshold (8). Reorder soon to prevent stockouts."
      }
    ],
    "topPerformers": [
      {
        "productName": "Coca-Cola 500ml Can",
        "sku": "BEV-COCA-500",
        "quantitySold": 8,
        "revenue": 360,
        "contributionPercent": 84.1,
        "insight": "Accounting for 84.1% of store revenue. Strong velocity mover."
      }
    ],
    "actionableRecommendations": [
      "Submit supplier purchase orders for 2 low-stock item(s) to avoid lost revenue.",
      "Feature top item 'Coca-Cola 500ml Can' in primary checkout display zone to maximize cross-selling.",
      "Conduct daily cash drawer reconciliation at the close of shift to verify tender accuracy."
    ],
    "generatedAt": "2026-10-18T14:36:41.269Z",
    "engine": "Google Gemini (gemini-2.5-flash)"
  }
}
```

---

## 4. Google Gemini SDK Configuration
To enable the Google Gemini API live model:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `server/.env.development`:
   ```bash
   GEMINI_API_KEY=your_actual_api_key
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_TIMEOUT_MS=15000
   STORE_TIMEZONE=Asia/Dhaka
   ```
3. Install the new `@google/genai` dependency and restart the server. For a running Docker development container:
   ```bash
   docker compose -f docker-compose.dev.yml exec server npm install
   docker compose -f docker-compose.dev.yml restart server
   ```

The official `@google/genai` SDK requests structured JSON and validates it at runtime. Gemini adds summaries and commentary; database-derived revenue, item quantities, stock levels, urgency and reorder quantities remain authoritative. Missing model annotations never remove low-stock alerts.

The default model is `gemini-2.5-flash`; override it with `GEMINI_MODEL`. Google currently lists it without an announced shutdown date on the [model lifecycle page](https://ai.google.dev/gemini-api/docs/deprecations). Requests default to a 15-second timeout (configuration capped at 60 seconds), with retries disabled so fallback is prompt. Missing keys, SDK errors, timeouts and invalid model responses use the heuristic engine. Database errors still surface as API errors.

If `STORE_TIMEZONE` is unset, calendar boundaries use UTC. Use an IANA timezone such as `Asia/Dhaka` for the store. Item revenue allocates each order's discounts and tax proportionally so contribution percentages use the same basis as total revenue.

---

## 5. Frontend Usage
- Click the **AI Copilot** button in the POS terminal top navigation bar.
- If items are low in stock, an amber pulsing notification dot will indicate that restock attention is required.
- Click **Copy Summary** to export the sales report to the clipboard.

