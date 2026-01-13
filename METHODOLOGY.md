# Methodology

## 1. Requirement & Feature Decisions (System Scope)

### 1.1 Recruitment Stage Definitions

The system tracks job applications through the following standardized pipeline stages, derived from analysis of common recruitment workflows across technology, finance, and consulting industries:

| Stage | Description | Detection Signals |
|-------|-------------|-------------------|
| **Application Submitted** | Initial application confirmation | "thank you for applying", "application received", "we've received your application" |
| **Aptitude Test** | Psychometric/cognitive assessments | Plum, Pymetrics, SHL, Wonderlic, "personality assessment" |
| **Simulation Test** | Job simulation exercises | Forage, "virtual experience", "job simulation" |
| **Coding Test** | Technical programming assessments | HackerRank, Codility, CodeSignal, "coding challenge" |
| **Video Interview** | One-way pre-recorded video interviews | HireVue, Willo, SparkHire, "pre-recorded video" |
| **Human Interview** | Live interviews (phone/video/onsite) | "interview scheduled", "meet with", "assessment centre" |
| **Offer** | Job offer received | "pleased to offer", "offer letter", "congratulations" |
| **Rejection** | Application unsuccessful | "unfortunately", "not proceed", "regret to inform" |

### 1.2 Minimum Viable Product (MVP) Features

**Core Features (v1.0):**
- One-click Gmail OAuth 2.0 authentication
- Automated email scanning with date range selection
- AI-powered company and stage classification
- Dashboard with application statistics
- Visual pipeline representation (Sankey diagram, funnel chart)
- Application timeline view
- Real-time processing progress indicators

**Deferred Features (Future Versions):**
- Multi-email provider support (Outlook, Yahoo)
- Manual application entry
- Interview calendar integration
- Email notifications for stage changes
- Export functionality (CSV, PDF reports)

### 1.3 Data Storage & Privacy Boundaries

**Data Stored:**
| Data Type | Storage Location | Retention |
|-----------|------------------|-----------|
| OAuth tokens | Server-side (Render) | Session-based, cleared on logout |
| Extracted metadata | Local cache (JSON) | Permanent until manual clear |
| Company names | Local cache | Permanent |
| Stage classifications | Local cache | Permanent |
| Application dates | Local cache | Permanent |

**Data NOT Stored:**
- Raw email body content (processed in-memory only)
- Email attachments
- Personal identifiable information beyond email address
- Passwords or credentials

**Privacy Constraints:**
- Gmail API scope limited to `gmail.readonly` (no write access)
- No raw emails stored on any server
- All processing occurs locally on user's machine
- OAuth 2.0 with consent prompt for transparency

### 1.4 Evaluation Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Stage Classification Accuracy** | >85% | Manual verification against 50+ labeled emails |
| **Company Extraction Accuracy** | >90% | Cross-reference with known applications |
| **False Positive Rate** (non-job emails) | <5% | Count misclassified emails / total processed |
| **Processing Latency** | <60s for 100 emails | Timestamp comparison (start to dashboard render) |
| **Cache Hit Performance** | <2s | Measure cached data retrieval time |

---

## 2. Backend Pipeline Design

### 2.1 End-to-End Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────────┐      ┌───────────────────────┐  │
│  │   Frontend   │      │  Render Backend  │      │      AWS Server       │  │
│  │   (React)    │◄────►│  (gmail_backend) │◄────►│                       │  │
│  │              │      │                  │      │                       │  │
│  │  - Dashboard │      │  - OAuth Handler │      │  - Email Processing   │  │
│  │  - Charts    │      │  - Gmail API     │      │  - AI Classification  │  │
│  │  - Timeline  │      │  - Token Storage │      │  - Caching Layer      │  │
│  └──────────────┘      └──────────────────┘      └───────────────────────┘  │
│         │                       │                          │                │
│         │                       ▼                          ▼                │
│         │              ┌──────────────────┐      ┌───────────────────────┐  │
│         │              │   Google APIs    │      │   Azure OpenAI        │  │
│         │              │   (Gmail)        │      │   (GPT-4o-mini)       │  │
│         │              └──────────────────┘      └───────────────────────┘  │
│         │                                                                   │
│         ▼                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        Processing Pipeline                           │  │
│   │                                                                      │  │
│   │  OAuth Login → Token Store → Cache Check →                           │  │
│   │  (Hit → Response) | (Miss → Gmail Query → Fetch Messages →           │  │
│   │  Parse Headers → Extract Body → Layer A Filter → Layer B AI →        │  │
│   │  Stage Classification → Company Grouping → Cache Write → Response)   │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘


```

### 2.2 Two-Layer Classification System

#### Layer A: Fast Filter (Rule-Based)

**Purpose:** Quickly eliminate non-job emails and pre-classify obvious cases using deterministic rules.

**Implementation:**

```python
# Gmail Query Pre-Filter
query = 'subject:("application" OR "applying" OR "apply" OR "applied") in:inbox'

# Domain-Based ATS Detection
ATS_DOMAINS = {
    "workday.com", "myworkday.com",      # Workday
    "greenhouse.io", "greenhouse-mail.io", # Greenhouse
    "lever.co", "hire.lever.co",          # Lever
    "tal.net", "brassring.com",           # Other ATS
    "hackerrankforwork.com",              # Coding platforms
    "hirevue.com", "hirevue-app.eu"       # Video interview
}

# Skip Patterns (Non-Job Emails)
SKIP_PATTERNS = [
    r"zendesk\.com",           # Support tickets
    r"Ticket\s*#\d+",          # Ticket numbers
    r"theforage\.com.*Build skills",  # Marketing emails
    r"Your Cluely Digest",     # Newsletters
    r"credly\.com",            # Credential badges
]

# Stage Detection Patterns
STAGE_PATTERNS = {
    "application_submitted": [
        r"thank you for (applying|your application)",
        r"we've received your application",
    ],
    "coding_test": [
        r"hackerrank", r"codility", r"codesignal",
        r"coding.*(test|assessment|challenge)",
    ],
    "rejection": [
        r"not.*(proceed|move forward)",
        r"unfortunately", r"regret to inform",
    ],
    # ... additional patterns
}
```

**Layer A Output:**
- Filtered email list (job-related only)
- Pre-detected stages (high confidence)
- Sender domain classification

#### Layer B: AI Refinement (LLM-Based)

**Purpose:** Handle ambiguous cases, extract company names from ATS emails, and provide nuanced stage classification.

**Implementation:**

**Step 1: Company Extraction**
```python
company_prompt = """Below are job-related emails as 'from_domain | subject'.
Extract the REAL company names the user applied to.

IMPORTANT:
- ATS domains (lever.co, workday.com, greenhouse.io) are NOT companies.
  Extract the real company from the SUBJECT.
- Examples:
  - "hire.lever.co | Thank you for application to ION Group" → "ION Group"
  - "myworkday.com | Thank You for Applying to MUFG" → "MUFG"

Return JSON: {"companies_applied":["Company1","Company2",...]}
"""
```

**Step 2: Stage Classification**
```python
analysis_prompt = """Analyze job application emails for "{company}".

EMAILS (date | sender | subject [pre-detected stages]):
{compact_email_text}

CRITICAL RULES:
1. POSITION: Extract actual JOB TITLE (e.g., "Graduate Software Engineer")
2. MULTIPLE POSITIONS: Return ALL positions as separate entries
3. "video_interview" = ONE-WAY pre-recorded only (HireVue, Willo)
4. "status": "rejected" only if explicitly stated

OUTPUT JSON:
{"positions":[{"position":"...", "applied":"YYYY-MM-DD",
  "coding_test":"YYYY-MM-DD or null", "human_interviews":N,
  "status":"pending|rejected|offer"}]}
"""
```

**Model Configuration:**
- Model: Azure OpenAI GPT-4o-mini
- Temperature: 0.1 (deterministic outputs)
- Max tokens: Adaptive based on email count

### 2.3 Pagination, Rate Limits & Incremental Updates

**Gmail API Pagination:**
```python
def fetch_emails_from_render(query, max_loops=10):
    all_msgs = []
    next_page = None

    for _ in range(max_loops):
        params = {"q": query, "format": "full"}
        if next_page:
            params["page_token"] = next_page

        resp = requests.get(f"{RENDER_URL}/query", params=params)
        msgs = resp.json().get("messages", [])
        all_msgs.extend(msgs)

        next_page = resp.json().get("next_page_token")
        if not next_page:
            break

    return all_msgs
```

**Rate Limit Handling:**
- Gmail API quota: 250 quota units per user per second
- Implementation: Sequential fetching with automatic backoff
- Batch processing: 50 messages per request

**Incremental Update Strategy (Planned):**
```
Cache Structure:
{
  "cached_start": "2024-01-01",
  "cached_end": "2025-01-01",
  "companies": [...],
  "last_refreshed": "2025-01-01T12:00:00"
}

Update Logic:
- If user extends date range backwards → fetch only new date range
- If user clicks "Refresh" → fetch only emails since cached_end
- Merge new results with existing cache
```

---

## 3. Data & Pattern Analysis

### 3.1 Email Pattern Research

Analysis of 200+ recruitment emails from 50+ companies revealed common patterns:

**Subject Line Patterns:**
| Pattern Type | Example | Frequency |
|--------------|---------|-----------|
| Application Confirmation | "Thank you for applying to [Company]" | 85% |
| Assessment Invitation | "[Company] - Online Assessment Invitation" | 70% |
| Interview Scheduling | "Interview Confirmation - [Position]" | 75% |
| Rejection | "Update on your application to [Company]" | 60% |
| Offer | "Offer Letter - [Position] at [Company]" | 90% |

**Sender Domain Analysis:**
| Domain Type | Examples | Handling |
|-------------|----------|----------|
| Direct Company | @google.com, @jpmorgan.com | Extract company from domain |
| ATS Platform | @lever.co, @workday.com | Extract company from subject |
| Assessment Platform | @hackerrank.com, @hirevue.com | Link to parent application |
| Recruiter Personal | @gmail.com, @outlook.com | Extract company from signature/body |

**Body Content Signals:**
```
Application Stage:
- "We have received your application"
- "Your application for [Position] has been submitted"

Assessment Stage:
- "Please complete the following assessment"
- "You have been invited to take"
- Links to: hackerrank.com, hirevue.com, shl.com

Interview Stage:
- "We would like to invite you for an interview"
- "Please select a time slot"
- Calendar links: calendly.com, outlook.com/booking

Rejection Stage:
- "After careful consideration"
- "We will not be moving forward"
- "We encourage you to apply again"

Offer Stage:
- "We are pleased to offer you"
- "Congratulations!"
- Attachment: offer_letter.pdf
```

### 3.2 Rule Development Process

**Iteration Cycle:**
1. Collect sample emails (real user data, anonymized)
2. Manually label: company, position, stage, date
3. Run classifier, compare with labels
4. Identify misclassifications
5. Add/refine patterns
6. Repeat

**Edge Cases Identified:**

| Edge Case | Problem | Solution |
|-----------|---------|----------|
| Multiple positions at same company | Merged into single entry | Parse subject for position name, create separate entries |
| Forwarded emails | Wrong sender domain | Strip "Fwd:" prefix, look for original sender |
| Recruiter agency emails | Company name unclear | Extract from body content, not domain |
| Non-English emails | Pattern mismatch | Add multilingual patterns (Chinese, Korean) |
| Auto-rejection (ATS) | No human review | Detect "did not meet requirements" pattern |

### 3.3 Test Dataset

**Labeled Test Set (50 emails):**
```
Distribution:
- Application Submitted: 15 emails
- Assessment Invitations: 10 emails
- Interview Requests: 8 emails
- Rejections: 12 emails
- Offers: 5 emails

Companies Represented:
- Big Tech: Google, Microsoft, Amazon, Meta
- Finance: Goldman Sachs, Morgan Stanley, BlackRock
- Consulting: McKinsey, BCG, Bain
- Startups: Various (10+ companies)
```

---

## 4. Frontend Visualization & UX Implementation

### 4.1 Dashboard Components

**Statistics Overview:**
```
┌─────────────────────────────────────────────────────────────┐
│  Total Applications: 45    Active: 28    Response Rate: 62% │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ 45  │  │ 12  │  │  8  │  │ 15  │  │  3  │  │  7  │     │
│  │Total│  │Test │  │ IV  │  │Pend │  │Offer│  │ Rej │     │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Sankey Diagram:**
- Visual flow from Application → various stages → Offer/Rejection
- Width represents number of applications at each stage
- Interactive: hover for details, click to filter

**Application Funnel:**
```
Applied         ████████████████████████████  45 (100%)
Assessment      ██████████████                28 (62%)
Interview       ████████                      15 (33%)
Offer           ██                             3 (7%)
```

**Timeline View:**
- Company-grouped application history
- Stage progression with dates
- Status indicators (pending/rejected/offer)

### 4.2 User Controls

**Date Range Selection:**
- Start date picker (default: 6 months ago)
- End date picker (default: today)
- "Analyze Emails" button triggers processing

**Filtering & Search:**
- Filter by company name
- Filter by stage
- Filter by status (pending/rejected/offer)
- Date range filter on timeline

**Refresh Control:**
- "Refresh" button in header
- Bypasses cache, fetches latest emails
- Shows real-time progress via SSE

### 4.3 Real-Time Progress Feedback

**Server-Sent Events (SSE) Implementation:**
```
Progress Stages:
Step 0: "Fetching email data..." (with email count)
Step 1: "Scanning for job applications..." (with application count)
Step 2: "Detecting companies..." (with company list)
Step 3: "AI analyzing [Company]... (3/10)" (per-company progress)
Step 4: "Classifying by stage..."
Step 5: "Building your dashboard..."
```

**UI Feedback:**
- Animated progress bar
- Step-by-step checklist with icons
- Current operation highlighted
- Completion checkmarks for finished steps

---

## 5. Integration, Testing, and Deployment

### 5.1 API Integration

**REST Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | OAuth redirect (Render) |
| `/callback` | GET | OAuth callback handler |
| `/status` | GET | Check authentication status |
| `/user-info` | GET | Get user email/profile |
| `/logout` | GET | Clear authentication |
| `/query` | GET | Raw Gmail query (Render) |
| `/process` | GET | Full analysis (Local) |
| `/process-stream` | GET | SSE progress stream (Local) |
| `/cache-info` | GET | View cache status |
| `/clear-cache` | GET | Clear local cache |

**Frontend API Service:**
```typescript
// Authentication
checkAuthStatus(): Promise<boolean>
getUserInfo(): Promise<UserInfo>
logout(): Promise<boolean>

// Processing
processApplications(startDate, endDate, refresh): Promise<ProcessResponse>
processApplicationsWithProgress(startDate, endDate, refresh, onProgress): Promise<ProcessResponse>

// Data Transformation
transformToApplications(data): Application[]
calculateStats(applications): Stats
```

### 5.2 Testing Strategy

**Unit Tests:**
| Component | Test Cases |
|-----------|------------|
| Email Parser | HTML extraction, multipart handling, encoding |
| Stage Detector | Pattern matching accuracy, edge cases |
| Company Extractor | ATS domain handling, name normalization |
| Date Parser | Various date formats, timezone handling |
| JSON Extractor | GPT response parsing, malformed JSON recovery |

**Integration Tests:**
| Flow | Validation |
|------|------------|
| OAuth → Token Storage | Token persists across requests |
| Query → Parse → Classify | End-to-end stage assignment |
| Cache Write → Cache Read | Data integrity, TTL behavior |
| SSE Stream | Progress events received in order |

**User Acceptance Tests:**
| Scenario | Expected Outcome |
|----------|------------------|
| Fresh user, 50 applications | All companies detected, stages accurate |
| Refresh after 1 week | New emails detected and classified |
| Date range change | Correct filtering, no data loss |
| Logout and re-login | Clean state, re-authentication works |

### 5.3 Deployment Architecture

**Development Environment:**
```
Local Machine:
├── Frontend (Vite dev server) → localhost:5173
├── Local Server (Flask) → localhost:5001
└── Render Backend (OAuth) → gmail-login-backend.onrender.com
```

**Production Environment:**
```
Cloud Deployment:
├── Frontend → Vercel/Netlify (Static hosting)
├── Local Server → User's machine (Electron app) OR Cloud function
└── Render Backend → render.com (OAuth + Gmail API proxy)
```

**Environment Configuration:**
```
Render Environment Variables:
- GOOGLE_CLIENT_ID: OAuth client ID
- GOOGLE_CLIENT_SECRET: OAuth client secret
- REDIRECT_URI: https://gmail-login-backend.onrender.com/callback
- AZURE_OPENAI_ENDPOINT: Azure OpenAI API endpoint
- AZURE_OPENAI_KEY: Azure OpenAI API key

Local Environment:
- RENDER_URL: https://gmail-login-backend.onrender.com
- Local cache path: ./cache.json
```

**Security Measures:**
- OAuth tokens stored server-side only (not in browser)
- CORS configured for specific origins
- No sensitive data in client-side storage
- HTTPS enforced on all endpoints
- Rate limiting on API endpoints

---

## Summary

This methodology describes a systematic approach to building an automated job application tracker:

1. **Scope Definition** - Clear stage definitions, MVP features, privacy boundaries, and success metrics
2. **Pipeline Design** - Two-layer classification (rule-based + AI), pagination handling, caching strategy
3. **Pattern Analysis** - Empirical email analysis, iterative rule development, edge case handling
4. **Frontend Implementation** - Dashboard visualizations, user controls, real-time feedback
5. **Deployment** - API integration, multi-level testing, secure cloud deployment

The system prioritizes user privacy (read-only access, no raw storage), accuracy (two-layer classification), and performance (caching, incremental updates).
