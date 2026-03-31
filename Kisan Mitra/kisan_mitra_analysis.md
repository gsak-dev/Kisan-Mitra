# Kisan Mitra — Complete Project Analysis

> **Kisan Mitra** ("Farmer's Friend") is an AI-powered full-stack web platform that helps Indian farmers and rural citizens discover, understand, and apply for government agriculture schemes they qualify for. It evaluates 30 high-quality central and state agricultural schemes against user profiles and provides personalized recommendations.

---

## 1. Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Backend Framework** | FastAPI (Python 3.13) | Async REST API with Pydantic validation, CORS middleware, lifespan events |
| **Frontend Framework** | React 18 (Vite + JSX) | SPA with React Router v6, protected routes, context providers |
| **Database** | Supabase (PostgreSQL) | Hosted Postgres with Auth, Row-Level Security (RLS), JSONB columns |
| **Auth** | Supabase Auth | Email/password signup & login, JWT sessions, service-key bypass for backend |
| **AI — Chat** | Groq API (LLaMA 3.3 70B Versatile) | Async streaming + non-streaming chat; supports SSE |
| **AI — OCR** | Google Gemini 1.5 Flash (via `google-generativeai`) | Vision model for extracting structured data from document images |
| **AI — Normalization** | Groq API (LLaMA 3.1 8B Instant) | Converts raw scheme data into a standardized JSON schema |
| **AI — Deduplication** | Groq API (LLaMA 3.1 8B Instant) | LLM-assisted fuzzy duplicate detection in the ingestion pipeline |
| **WhatsApp Bot** | Twilio Messaging API | Twilio sandbox webhook for WhatsApp conversations |
| **PDF Generation** | ReportLab | A4 action plan PDFs with tables, charts, color-coded branding |
| **Web Search** | DuckDuckGo (HTML scraper) | Custom DDG scraper for real-time scheme news + enrichment |
| **Web Scraping** | BeautifulSoup4 + httpx | Scrapes official gov.in sites for enrichment data |
| **Scheduler** | APScheduler (AsyncIOScheduler) | Cron jobs for automated data ingestion (PIB every 6hr, HuggingFace weekly) |
| **Data Source — HuggingFace** | `datasets` library | Loads `shrijayan/gov_myscheme` dataset |
| **Data Source — PIB** | `feedparser` (RSS) | Parses Press Information Bureau RSS feed for new scheme announcements |
| **Styling** | Vanilla CSS (index.css) | Custom design system, green/emerald theme, responsive |
| **Notifications (Frontend)** | react-hot-toast | Toast notifications for success/error states |
| **HTTP Client** | httpx (backend), fetch (frontend) | Async HTTP for scraping and API calls |
| **Environment** | python-dotenv | [.env](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/.env) file for API keys and config |

### Key Environment Variables ([.env](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/.env))
```
SUPABASE_URL, SUPABASE_SERVICE_KEY
GROQ_API_KEY
GEMINI_API_KEY
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
FRONTEND_URL
```

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  Landing → Auth → Onboarding → Dashboard → Schemes/Chat/... │
│                  Runs on localhost:5173                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API calls (fetch)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI on :8000)                    │
│                                                              │
│  Routes:  /api/auth, /api/schemes, /api/chat, /api/ocr,     │
│           /api/whatsapp, /api/reports, /api/profile,         │
│           /api/bookmarks                                     │
│                                                              │
│  Services: eligibility_service, groq_service,                │
│            gemini_service, ingestion_pipeline,                │
│            normalizer, deduplicator, enricher,               │
│            pdf_service, search_service, scheduler            │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐  ┌───────────┐  ┌──────────────────┐
  │Supabase │  │ Groq API  │  │ Google Gemini API │
  │(Postgres)│  │(LLaMA 3.3)│  │(Vision OCR)      │
  └─────────┘  └───────────┘  └──────────────────┘
       ▲
       │ Data ingestion
  ┌────┴────────────────────────────────┐
  │ Data Sources:                        │
  │  • HuggingFace (gov_myscheme dataset)│
  │  • PIB RSS Feed                      │
  │  • MyScheme.gov.in (scraper)         │
  │  • data.gov.in API                   │
  │  • CSV upload                        │
  └──────────────────────────────────────┘
```

### Backend File Structure
```
backend/
├── main.py                      # FastAPI app entry point, CORS, routers, lifespan
├── .env                         # API keys and config
├── requirements.txt             # Python dependencies
├── supabase_schema.sql          # Database DDL
├── routes/
│   ├── auth.py                  # POST /register, /login
│   ├── schemes.py               # GET /all, POST /check-eligibility, /whatif, admin endpoints
│   ├── chat.py                  # POST /chat (SSE), /chat/simple, /chat/save, history, feedback
│   ├── ocr.py                   # POST /extract (image upload → Gemini Vision → JSON)
│   ├── whatsapp.py              # POST /webhook (Twilio WhatsApp bot)
│   ├── reports.py               # POST /action-plan (PDF download), admin stats
│   ├── profile.py               # GET/PUT user profile
│   └── bookmarks.py             # POST /toggle, GET bookmarks
├── services/
│   ├── eligibility_service.py   # Core engine: evaluates 57+ schemes against profile
│   ├── groq_service.py          # LLaMA 3.3 chat (streaming + simple), system prompt builder
│   ├── gemini_service.py        # Gemini Vision OCR + profile validation + scheme coverage
│   ├── ingestion_pipeline.py    # Orchestrates: Enrich → Normalize → Deduplicate → Upsert
│   ├── normalizer.py            # LLM-powered JSON normalization (LLaMA 3.1 8B)
│   ├── deduplicator.py          # 4-layer dedup: exact ID → alias → fuzzy → LLM verdict
│   ├── enricher.py              # Web search + scraping for sparse scheme data
│   ├── search_service.py        # DuckDuckGo HTML scraper for real-time search
│   ├── pdf_service.py           # ReportLab PDF generation (A4, branded, tables)
│   ├── scheduler.py             # APScheduler: PIB every 6hr, HuggingFace weekly
│   ├── twilio_service.py        # Twilio WhatsApp messaging helper
│   └── data_sources/
│       ├── huggingface_source.py # Loads shrijayan/gov_myscheme dataset
│       ├── pib_source.py         # PIB RSS feed parser
│       ├── myscheme_source.py    # MyScheme.gov.in web scraper
│       ├── datagov_source.py     # data.gov.in API connector
│       └── csv_source.py         # CSV file import
├── database/
│   └── supabase_client.py       # Supabase client singleton
└── data/
    └── schemes.json             # Local fallback scheme data
```

### Frontend File Structure
```
frontend/src/
├── App.jsx                # Router setup with ProtectedRoute and AdminRoute guards
├── main.jsx               # Entry point (React root)
├── index.css              # Global design system (green/emerald theme)
├── context/
│   ├── UserContext.jsx     # Auth state, user profile, Supabase session management
│   └── LanguageContext.jsx # i18n: English, Hindi, Marathi language switching
├── pages/
│   ├── Landing.jsx         # Public landing page with feature showcase
│   ├── AuthPage.jsx        # Login/Register forms (email + password)
│   ├── AdminLogin.jsx      # Separate admin authentication
│   ├── Onboarding.jsx      # Multi-step profile wizard (demographics, land, income, docs)
│   ├── Dashboard.jsx       # Personalized dashboard: eligible schemes, stats, quick actions
│   ├── Schemes.jsx         # Browse/filter/search 30 agricultural schemes with eligibility status
│   ├── Chat.jsx            # AI chatbot interface (multilingual, with feedback buttons)
│   ├── Documents.jsx       # Upload documents → Gemini OCR → auto-fill profile
│   ├── ActionPlan.jsx      # Prioritized action plan with PDF download
│   ├── BenefitCalc.jsx     # "What-If" simulator: change profile → see gained/lost schemes
│   ├── ProfileEdit.jsx     # Edit full user profile
│   ├── Bookmarks.jsx       # Saved/bookmarked schemes
│   └── Admin.jsx           # Admin panel: stats, ingestion logs, scheme review
├── hooks/                  # Custom React hooks
├── components/             # Reusable UI components
├── utils/                  # API helpers, constants
└── data/                   # Static data / scheme metadata
```

---

## 3. Database Schema (Supabase/PostgreSQL)

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User profiles (extends `auth.users`) | [id](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/normalizer.py#123-137) (UUID, FK to auth.users), `email`, `name`, `phone`, `language_preference`, [profile](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/gemini_service.py#117-160) (JSONB — stores all demographic, land, income, document ownership data) |
| [schemes](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/deduplicator.py#112-160) | Government scheme catalog | [id](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/normalizer.py#123-137) (slug), `name`, `canonical_name`, `aliases[]`, `category[]`, `states[]`, [eligibility](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/chat.py#54-63) (JSONB), `documents_required[]`, `benefit_amount`, `deadline`, `apply_url`, `is_active`, [needs_review](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/schemes.py#106-113), `confidence_score`, `sources[]`, `source_ids` (JSONB) |
| `chat_history` | Conversation logs | `user_id`, `role` (user/assistant), `content`, `language`, `created_at` |
| [chat_feedback](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/chat.py#151-168) | Thumbs up/down on AI responses | `user_id`, `ai_message`, `rating` (up/down) |
| [user_bookmarks](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/bookmarks.py#42-56) | Saved schemes per user | `user_id`, `scheme_id` |
| [ingestion_logs](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/schemes.py#100-105) | Pipeline run logs | [source](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/ingestion_pipeline.py#64-89), `processed`, `new_schemes`, `merged`, `failed`, `needs_review_count`, `duration_seconds` |
| `failed_ingestions` | Failed pipeline items for debugging | `raw_data` (JSONB), `source_url`, `error` |

### Security
- **Row-Level Security (RLS)** is enabled on `users` and `chat_history`.
- Frontend uses Supabase **anon key** (respects RLS).
- Backend uses **service key** (bypasses RLS for admin operations).

---

## 4. Feature Breakdown

### 4.1 Eligibility Engine (Core Feature)
**File:** [services/eligibility_service.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/eligibility_service.py) (322 lines)

The heart of the platform. Evaluates each user profile against every scheme using strict agricultural rule checks:

1. **Farmer Requirement** — restricts entries purely to farmers and agricultural laborers.
2. **Land Holding** — checks if land ownership is required and enforces min/max acres bounds.
3. **Crop Requirement** — filters schemes that strictly require active crop cultivation.
4. **Age constraints** (min/max)
5. **Disqualifiers** — government employee, income tax payer, loan defaulter, institutional landowner
6. **Document readiness check** — tracks 27+ document types the user has/doesn't have.

**Output per scheme:** `{ eligible, partially_eligible, match_percent, failure_reasons[], warnings[], missing_documents[], priority_score }`

- **Priority Score Formula:** [(benefit_amount × match_percent/100 × urgency) / 1000](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/frontend/src/App.jsx#86-105)
  - Urgency is derived from deadline proximity: `max(1.5 − days_left/365, 0.5)`
- Results are sorted by priority score descending.

**What-If Simulator:** [run_whatif(profile, changes)](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/eligibility_service.py#292-316) — applies hypothetical changes (e.g., "what if I had 5 acres of land?") and returns diff of gained/lost scheme eligibility.

### 4.2 AI Chatbot
**Files:** [services/groq_service.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/groq_service.py), [routes/chat.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/chat.py)

- **Model:** LLaMA 3.3 70B Versatile (via Groq API)
- **Two modes:**
  - **SSE Streaming** (`POST /api/chat`) — Server-Sent Events for real-time typing effect
  - **Simple JSON** (`POST /api/chat/simple`) — Single response, used by the React frontend
- **System prompt** is dynamically built with:
  - User profile (name, age, state, occupation, income, land, caste, gender)
  - Full eligibility results (eligible, partial, ineligible counts and scheme names)
  - 11 behavioral rules (speak only about schemes, use exact counts, simple language, etc.)
- **Multilingual:** English, Hindi, Marathi — controlled by `language` parameter
- **Web Search Tool Calling:** When the AI detects the user asking about latest updates/news, it outputs a JSON `{"SEARCH_TOOL": "query"}`. The backend intercepts this, runs a DuckDuckGo search, feeds results back to the LLM, and returns a synthesized answer. This is a custom pseudo-tool-calling implementation.
- **Chat History:** Stored in Supabase `chat_history` table. Last 20 messages loaded on page open. Users can delete history.
- **Feedback:** Thumbs up/down stored in [chat_feedback](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/chat.py#151-168) table.

### 4.3 Document OCR & Validation
**Files:** [services/gemini_service.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/gemini_service.py), [routes/ocr.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/ocr.py)

- **Model:** Google Gemini 1.5 Flash (Vision)
- **Upload:** User uploads a photo of a government document (JPEG/PNG/WebP, max 10MB)
- **OCR Extraction:** Gemini Vision extracts structured JSON fields:
  - `document_type` (aadhaar, PAN, land record, income cert, caste cert, bank passbook, voter ID, ration card, etc.)
  - `name`, `dob`, `id_number`, `address`, `state`, `district`, `gender`, `father_name`
  - Document-specific: `land_area`, `survey_number`, `account_number`, `ifsc_code`, `income_amount`
  - `confidence` score (0.0–1.0)
- **Profile Cross-Validation:** Compares extracted data against user profile — flags mismatches in name, state, district, gender.
- **Scheme Coverage Mapping:** Maps document type → which schemes require that document → tells user "this document covers scheme X, Y, Z."
- **Quota Fallback:** If Gemini API quota is exhausted, returns mock demo data so the app remains functional.

### 4.4 Data Ingestion Pipeline
**Files:** [services/ingestion_pipeline.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/ingestion_pipeline.py), [normalizer.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/normalizer.py), [deduplicator.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/deduplicator.py), [enricher.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/test_enricher.py), `data_sources/`

A 4-stage pipeline that automatically collects, normalizes, deduplicates, and stores government scheme data:

**Stage 1 — Data Collection** (5 sources):
- **HuggingFace:** Loads `shrijayan/gov_myscheme` dataset (bulk scheme data)
- **PIB RSS:** Press Information Bureau RSS feed for new scheme announcements
- **MyScheme.gov.in:** Web scraper for official government scheme portal
- **data.gov.in:** Open government data API
- **CSV:** Manual CSV import option

**Stage 2 — Enrichment** ([enricher.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/test_enricher.py)):
- If a scheme has <800 characters of text, searches DuckDuckGo for official eligibility criteria
- Scrapes top 2 results from gov.in/nic.in domains
- Adds scraped text as `web_context` field for the normalizer

**Stage 3 — Normalization** ([normalizer.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/normalizer.py)):
- Uses **LLaMA 3.1 8B Instant** (via Groq) with a detailed prompt to convert raw scheme data into a standardized JSON schema
- The schema has 30+ fields including structured eligibility criteria, document requirements, benefit amounts, deadlines
- Generates URL-safe slug IDs automatically
- Flags low-confidence entries for human review

**Stage 4 — Deduplication** ([deduplicator.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/deduplicator.py)):
- **Layer 1:** Exact ID match
- **Layer 2:** Alias array lookup (checks if new scheme ID exists in any existing scheme's aliases)
- **Layer 3:** Fuzzy name matching using `SequenceMatcher` (with ministry boost)
- **Layer 4:** LLM verdict — for scores between 0.65–0.88, asks LLaMA 3.1 8B to judge if two entries are the same scheme
- **Merge logic:** If duplicate found, merges lists (sources, aliases, categories, documents), fills null fields from new data, preserves existing non-null data, takes higher confidence score

**Scheduling:** APScheduler runs automatically:
- PIB RSS check every 6 hours
- HuggingFace full sync every Sunday at 2 AM IST

### 4.5 PDF Report Generation
**Files:** [services/pdf_service.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/pdf_service.py), [routes/reports.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/reports.py)

- Generates branded A4 PDF reports using ReportLab
- Content: header with user info, summary box (eligible count, total benefit ₹, partial count), prioritized action plan table (top 15 schemes), unified document checklist
- Downloadable from the Action Plan page

### 4.6 WhatsApp Bot
**Files:** [routes/whatsapp.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/whatsapp.py), [services/twilio_service.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/twilio_service.py)

- Twilio sandbox webhook for WhatsApp integration
- **State machine:** Tracks per-phone sessions in-memory
- **Flow:**
  1. New user → sends onboarding link to the web app
  2. "STATUS" or "HELP" → runs eligibility engine, returns top 3 schemes
  3. "1", "2", "3" → returns detailed info for that scheme (benefit, deadline, apply URL)
- Potential for production SMS/WhatsApp notifications

### 4.7 Scheme Bookmarking
**File:** [routes/bookmarks.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/bookmarks.py)

- Toggle bookmark per user per scheme (insert/delete)
- Fetch user's bookmarked scheme IDs
- Fetch full scheme objects for bookmarked schemes

### 4.8 What-If Simulator (Benefit Calculator)
**Frontend:** [BenefitCalc.jsx](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/frontend/src/pages/BenefitCalc.jsx) | **Backend:** eligibility service's [run_whatif()](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/services/eligibility_service.py#292-316)

- User modifies hypothetical profile values (e.g., land, income, caste, BPL status)
- Backend re-runs full eligibility with modified profile
- Returns diff: schemes gained, schemes lost, new totals

### 4.9 Admin Panel
**Frontend:** [Admin.jsx](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/frontend/src/pages/Admin.jsx), [AdminLogin.jsx](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/frontend/src/pages/AdminLogin.jsx) | **Backend:** admin endpoints in [schemes.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/schemes.py), [reports.py](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/routes/reports.py)

- Separate admin auth (not Supabase-based, simple password check)
- Stats dashboard: total users, total schemes discovered, benefit unlocked, state distribution
- Ingestion logs: view last 20 pipeline runs with stats
- Schemes needing review: list of low-confidence/flagged schemes
- Manual sync trigger: trigger HuggingFace or PIB ingestion on demand
- Scheme cache refresh: reload schemes from Supabase into in-memory cache

---

## 5. User Workflow

```
1. LANDING PAGE → User discovers the platform
        │
2. REGISTER/LOGIN → Email + password auth (Supabase Auth)
        │
3. ONBOARDING (Multi-step wizard)
   ├── Step 1: Personal Info (name, age, state, district)
   ├── Step 2: Livelihood (landowning farmer / tenant farmer, annual income, land acres, crops grown, irrigation method)
   ├── Step 3: Financial (farm loan, KCC, tractor ownership, FPO member)
   └── Step 4: Document Inventory (checkboxes for relevant document types)
        │
4. DASHBOARD → Personalized view
   ├── Summary cards: eligible count, total ₹ benefit, partial count
   ├── Top eligible schemes (sorted by priority score)
   ├── Quick actions: Chat, Upload Documents, View All Schemes
        │
5. SCHEMES EXPLORER → Browse/filter/search all 30 agricultural schemes
   ├── Filter by: category, state, eligibility status
   ├── Each scheme card: eligibility badge, match %, benefit ₹, deadline
   ├── Bookmark schemes for later
        │
6. AI CHAT → Ask questions about schemes
   ├── "Which schemes am I eligible for?"
   ├── "What do I need for PM-KISAN?"
   ├── "Latest news on PMFBY installment dates" → triggers web search
   ├── Supports Hindi, English, Marathi
        │
7. DOCUMENT UPLOAD → Scan documents with AI
   ├── Upload photo → Gemini OCR → structured data extraction
   ├── Auto-validation against profile
   ├── Shows which schemes this document covers
        │
8. ACTION PLAN → Prioritized step-by-step plan
   ├── Ranked by priority score (benefit × match × urgency)
   ├── Missing document checklist
   └── Download as PDF report
        │
9. WHAT-IF SIMULATOR → Hypothetical scenario testing
   ├── "What if I had 5 acres?" → gained/lost scheme diff
   └── Helps users understand what actions unlock more benefits
```

---

## 6. API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Register new user (email, password, name, phone) |
| `POST` | `/api/auth/login` | Login (returns JWT session) |
| `GET` | `/api/schemes/all` | Get all schemes (from in-memory cache) |
| `POST` | `/api/schemes/check-eligibility` | Run eligibility engine against user profile |
| `POST` | `/api/schemes/whatif` | What-if scenario simulator |
| `GET` | `/api/schemes/{id}` | Get single scheme by ID |
| `POST` | `/api/schemes/refresh` | Reload scheme cache from Supabase |
| `POST` | `/api/chat` | SSE streaming chat |
| `POST` | `/api/chat/simple` | Non-streaming chat (frontend uses this) |
| `GET` | `/api/chat/history?user_id=...` | Load chat history (last 40 messages) |
| `POST` | `/api/chat/save` | Save user+assistant exchange |
| `DELETE` | `/api/chat/history?user_id=...` | Delete user's chat history |
| `POST` | `/api/chat/feedback` | Thumbs up/down on AI response |
| `POST` | `/api/ocr/extract` | Upload document image → Gemini OCR extraction |
| `POST` | `/api/whatsapp/webhook` | Twilio WhatsApp webhook |
| `POST` | `/api/reports/action-plan` | Generate & download PDF action plan |
| `GET` | `/api/reports/admin/stats` | Admin analytics dashboard data |
| `GET` | `/api/profile/{user_id}` | Get user profile |
| `PUT` | `/api/profile/{user_id}` | Update user profile |
| `POST` | `/api/bookmarks/toggle` | Toggle bookmark for a scheme |
| `GET` | `/api/bookmarks/{user_id}` | Get user's bookmarked scheme IDs |
| `GET` | `/api/bookmarks/{user_id}/schemes` | Get full scheme objects for bookmarks |
| `POST` | `/api/schemes/admin/trigger-sync` | Manually trigger data ingestion |
| `GET` | `/api/schemes/admin/ingestion-logs` | View ingestion run history |
| `GET` | `/api/schemes/admin/needs-review` | List schemes flagged for review |

---

## 7. AI Models Used — Summary

| Use Case | Model | Provider | Purpose |
|----------|-------|----------|---------|
| User Chat | LLaMA 3.3 70B Versatile | Groq | Conversational AI advisor for scheme queries |
| Document OCR | Gemini 1.5 Flash | Google | Vision model for extracting text from document images |
| Scheme Normalization | LLaMA 3.1 8B Instant | Groq | Converting raw scheme data to standardized JSON |
| Duplicate Detection | LLaMA 3.1 8B Instant | Groq | Judging if two scheme entries are the same |

---

## 8. How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload     # Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # Runs on http://localhost:5173
```

### Required [.env](file:///c:/Users/Saksham%20C/Documents/Kisan%20Mitra-3/Kisan%20Mitra/backend/.env) (backend)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AI...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
FRONTEND_URL=http://localhost:5173
```

---

## 9. Key Design Decisions

1. **Dual eligibility engine** — Both frontend JS and backend Python run the same eligibility logic. The chat endpoint accepts pre-computed frontend results to avoid divergence. The engine recently transitioned to a strictly *farmer-oriented* structure prioritizing agricultural land, farming constraints, and cropping rather than broad demographic checkboxes like BPL or Caste.
2. **In-memory scheme cache** — Schemes are loaded locally into `ALL_SCHEMES` and served from memory for fast reads. A `/refresh` endpoint reloads without restart.
3. **LLM-assisted data pipeline** — Raw scheme data is messy and heterogeneous across sources. Using LLMs for normalization and deduplication handles edge cases that rule-based parsers can't.
4. **Custom pseudo-tool-calling** — Instead of using Groq's native function calling, the chatbot uses a JSON format (`{"SEARCH_TOOL": "query"}`) that the backend detects and processes. This allows web search without native tool support.
5. **Graceful degradation** — Gemini OCR falls back to mock data on quota exhaustion. Scheme loading falls back to local JSON if Supabase is unavailable.
6. **Multi-source data fusion** — 5 data sources are ingested, deduplicated, and merged. Each scheme tracks its `sources[]` and `source_ids{}` for provenance.
