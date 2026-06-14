# Xeno Mini CRM — Technical Design & Documentation

Welcome to the **Xeno Mini CRM** codebase documentation. This document details the system architecture, code design patterns, segment evaluation, Gemini integrations, simulation loops, operational instructions, and scale characteristics.

---

## 1. Project Architecture Diagram

Below is the ASCII block overview of how data flows between the user's browser, the CRM API backend, the Google Gemini LLM, and the simulated communication dispatch service.

```
                  ┌──────────────────────────────┐
                  │   Client Browser (React UI)  │
                  └──────────────┬───────────────┘
                                 │
                     HTTP / REST │ JSON Payloads
                                 ▼
                  ┌──────────────────────────────┐
                  │    CRM Backend (Express)     │
                  └──────┬──────┬─────────▲──────┘
                         │      │         │
      Mongoose Queries / │      │         │ HTTP Callbacks /
      JSON Schema writes │      │         │ Receipt Webhooks
                         ▼      │         │
                  ┌──────────┐  │         │
                  │ MongoDB  │  │         │
                  │ Database │  │         │
                  └──────────┘  │         │ Dispatch Requests
                                │         │ (POST /send)
             Gemini API calls   │         │
             (Rules / Message)  ▼         │
                       ┌──────────┐  ┌────┴────────────┐
                       │  Google  │  │ Channel Service │
                       │  Gemini  │  │   (Simulator)   │
                       └──────────┘  └─────────────────┘
```

---

## 2. Directory Structure & File Index

The application is structured into three clean, focused folders: `backend`, `channel-service`, and `frontend`.

```
xeno-crm/
│
├── backend/
│   ├── controllers/
│   │   ├── customerController.js  ← Handles search, csv streams & seeding
│   │   ├── segmentController.js   ← Manages segment CRUD & rule preview counts
│   │   ├── campaignController.js  ← Configures campaigns & background send loops
│   │   ├── aiController.js        ← Handles natural language AI endpoint hooks
│   │   └── receiptController.js   ← Receives and updates carrier status hooks
│   ├── models/
│   │   ├── Customer.js            ← Customer profile metrics schema
│   │   ├── Order.js               ← Individual order transaction log
│   │   ├── Segment.js             ← Target rule filters schema
│   │   ├── Campaign.js            ← Campaign configuration and aggregations
│   │   └── CommunicationLog.js    ← Customer level carrier receipt logs
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   ├── segmentRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── aiRoutes.js
│   │   └── receiptRoutes.js
│   ├── services/
│   │   ├── segmentEngine.js       ← Rules to MongoDB query translator
│   │   ├── geminiService.js       ← Google Gemini API interface & fallbacks
│   │   └── channelService.js      ← HTTP client for dispatch server calls
│   ├── seed/
│   │   └── seedData.js            ← Mock data seeder (100 customers + orders)
│   ├── middleware/
│   │   └── upload.js              ← Multer memory buffer configuration
│   ├── .env
│   ├── server.js                  ← API express entry point
│   └── package.json
│
├── channel-service/
│   ├── .env
│   ├── server.js                  ← Simulated callback server (Port 6000)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      ← Stat grids, recents list, Recharts graphics
│   │   │   ├── Customers.jsx      ← Search, pagination, CSV uploads, template links
│   │   │   ├── Segments.jsx       ← Tabbed builder modal (manual/AI) & grids
│   │   │   ├── Campaigns.jsx      ← Draft lists & create campaign trigger modal
│   │   │   └── CampaignDetail.jsx ← Funnel percentages, progress, & live polling
│   │   ├── components/
│   │   │   ├── Navbar.jsx         ← Sidebar navigation items
│   │   │   ├── StatCard.jsx       ← Custom indicators with count-up effects
│   │   │   ├── SegmentBuilder.jsx ← Manual criterion compiler UI
│   │   │   ├── AISegmentInput.jsx ← NL rule generation interface
│   │   │   ├── CampaignForm.jsx   ← Campaign draft creator
│   │   │   ├── AIMessageDraft.jsx ← Gemini message copywriter UI
│   │   │   ├── CommunicationTable.jsx ← Detailed status badge log table
│   │   │   ├── CSVUpload.jsx      ← Drag-and-drop CSV importer modal
│   │   │   ├── ProgressBar.jsx    ← Horizontal rate bar
│   │   │   └── ToastContext.jsx   ← Global success/error toasts HUD
│   │   ├── services/
│   │   │   └── api.js             ← Centralized Axios API request client
│   │   ├── App.jsx                ← App layout and client routers
│   │   ├── main.jsx
│   │   └── index.css              ← Main style config & custom scrollbars
│   ├── index.html
│   ├── tailwind.config.js         ← Dark theme design tokens
│   ├── postcss.config.js
│   └── package.json
│
└── PROJECT_STRUCTURE.md           ← Technical blueprint document (this file)
```

---

## 3. Core CRM Engine Mechanics

### The Segment Engine (`segmentEngine.js`)
Converts rules arrays structured as:
```json
[
  { "field": "totalSpend", "operator": "gt", "value": 5000 },
  { "field": "daysSinceLastOrder", "operator": "gt", "value": 60 }
]
```
into valid MongoDB queries:
```javascript
{
  totalSpend: { $gt: 5000 },
  lastOrderDate: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
}
```
**Special Date Translation**: `daysSinceLastOrder` filters are translated by subtracting the days parameter from `Date.now()`. Crucially, a *larger* duration since the last purchase represents an *older* timestamp, so operators are logically inverted (e.g., `gt` becomes `$lt`).

### Dynamic Message Personalization
During campaign dispatch, variables are evaluated. The system looks for `{{name}}` inside the campaign body text and substitutes it with the current customer record's `name` string before transmission.

---

## 4. Workflows & Lifecycle Loops

### Campaign Send Flow
1. User clicks **"Send Campaign"** on a draft campaign card.
2. The CRM Backend resolves the target segment's query.
3. The database is queried for matching customer documents.
4. **Communication logs** are created in the database with status `sent`.
5. The campaign's status changes to `sending`.
6. An asynchronous background routine starts delivering payloads to the Channel Service.
7. **The response returns immediately to the client** to avoid browser timeouts.

### Channel Service Callback Loop
1. The Channel Service receives a dispatch payload.
2. It responds `200 OK` to acknowledge it.
3. It waits **1000ms–3000ms** (network latency).
4. A random seed determines outcome: **85% delivered, 15% failed**.
5. It POSTs back to the CRM receipt webhook with the status.
6. If delivered, it waits another **2000ms–5000ms**, and has a **40% chance** to POST an `opened` status.
7. If opened, it waits **1000ms–3000ms**, and has a **25% chance** to POST a `clicked` status.
8. **Retries**: If callback calls fail, the simulator retries up to **3 times with a 2-second delay**.

### Gemini AI Features
* **AI Segmentation**: Evaluates plain English sentences against `totalSpend`, `orderCount`, and `daysSinceLastOrder` boundaries and returns a clean, structured JSON array of query rules.
* **AI Message Copywriter**: Crafts short, action-oriented, personalized messages under 160 characters using `{{name}}` values.
* *Note*: If no `GEMINI_API_KEY` is active, the CRM falls back to a regex-based parser and static template copywriter, making it fully functional for reviews.

---

## 5. Environment Settings

### backend/.env
* `PORT`: Server port (default: `5000`)
* `MONGODB_URI`: Connection string (local default: `mongodb://127.0.0.1:27017/xeno-crm`)
* `GEMINI_API_KEY`: API access key from Google AI Studio.
* `CHANNEL_SERVICE_URL`: Port where simulator is hosted (default: `http://localhost:6000`)
* `CRM_RECEIPT_URL`: Callback location passed to simulator (default: `http://localhost:5000/api/receipt`)

### channel-service/.env
* `PORT`: Server port (default: `6000`)
* `CRM_RECEIPT_URL`: Fallback hook if none is passed in dispatch payload.

### frontend/.env
* `VITE_API_URL`: Root path of CRM backend server (default: `http://localhost:5000/api`)

---

## 6. How to Run Locally

### Prerequisites
* **Node.js**: (v18+)
* **MongoDB**: Make sure MongoDB is running locally (e.g. `mongod`).

### Step-by-Step Launch

1. **Clone and Setup Backend**:
   ```bash
   cd backend
   npm install
   npm run seed    # Generates 100 Indian customers + 400+ orders
   npm run dev     # Starts backend API on http://localhost:5000
   ```

2. **Setup Channel Service**:
   ```bash
   cd ../channel-service
   npm install
   npm run dev     # Starts simulator on http://localhost:6000
   ```

3. **Setup React Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev     # Launches Vite server on http://localhost:5173
   ```

4. Open `http://localhost:5173` in your browser.

---

## 7. Deployment Blueprint

1. **Database**: Create a free-tier cluster on MongoDB Atlas. Whitelist IP address `0.0.0.0/0` to support hosting connections.
2. **CRM Backend**: Deploy as a Web Service on Render. Add environment variables for `MONGODB_URI`, `GEMINI_API_KEY`, and `CHANNEL_SERVICE_URL`.
3. **Channel Service**: Deploy as a standalone Web Service on Render. Set `CRM_RECEIPT_URL` to point to the deployed Render backend URL.
4. **React Frontend**: Deploy to Vercel. Bind the environment variable `VITE_API_URL` to point to your deployed Render backend API gateway.

---

## 8. Development Tradeoffs & Scaling Considerations

### Core Tradeoffs Made
* **No Authentication**: Built purely for speed and live interviewer demonstrations. No login checks are required.
* **In-Memory Uploads**: Multer parses CSV data in memory. Perfect for take-home demos, but larger files (100k+ rows) could cause Node.js process out-of-memory errors.
* **Polling (5s)**: Replaces real-time WebSockets with 5-second polling. Fits the specs and avoids socket connection management complexities.

### Scaling the Architecture to 10x
1. **Message Dispatch Queuing**: Replacing direct HTTP post loops with a message broker (e.g., RabbitMQ, BullMQ, or AWS SQS). A worker pool would process the queue, preventing backend server congestion.
2. **Batch Ingestion**: Customer and Order CSV streams should upload directly to cloud storage (e.g., AWS S3). A background worker thread would stream and bulk-write documents in pages using Mongo bulk-write indices, keeping memory usage low.
3. **Optimized Callback Logging**: Webhook status callback handling should write to a high-speed write-heavy store (e.g., Redis) or queue, and then sync updates to Mongoose models in batches rather than writing directly on every single webhook hit.
