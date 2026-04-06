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
- Manual application entry and editing

**Extended Features (v1.1 — Implemented):**
- CV upload and AI-powered analysis against application history
- Personalized job recommendations via Adzuna API
- LinkedIn share button with auto-generated stats summary
- AI chatbot assistant with application context
- Performance analytics (response rates, stage conversion, pending vs rejected)
- Bottleneck Insights — auto-detects drop-off stage and links to HKU CEDARS resources (VMock, Aptitude Tests, DropPicker)

**Deferred Features (Future Versions):**
- Multi-email provider support (Outlook, Yahoo)
- Interview calendar integration
- Email notifications for stage changes
- Export functionality (CSV, PDF reports)

### 1.3 Data Storage & Privacy Boundaries

**Data Stored:**
| Data Type | Storage Location | Retention |
|-----------|------------------|-----------|
| OAuth tokens | Server-side (EC2) | Session-based, cleared on logout |
| Extracted metadata | EC2 cache (JSON) | Permanent until manual clear |
| Company names | EC2 cache | Permanent |
| Stage classifications | EC2 cache | Permanent |
| Application dates | EC2 cache | Permanent |

**Data NOT Stored:**
- Raw email body content (processed in-memory only)
- Email attachments
- Personal identifiable information beyond email address
- Passwords or credentials

**Privacy Constraints:**
- Gmail API scope limited to `gmail.readonly` (no write access)
- No raw emails stored on any server
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
│  ┌──────────────┐      ┌───────────────────────┐   ┌─────────────────────┐ │
│  │   Frontend   │      │    AWS EC2 t2.micro    │   │   Local Machine     │ │
│  │   (React)    │      │  nginx + Let's Encrypt │   │  Cloudflare Tunnel  │ │
│  │   Vercel     │      │  jobtracker-auth.ddns  │   │  *.trycloudflare    │ │
│  │  - Dashboard │◄────►│  .net → :5678          │   │  .com → :5001       │ │
│  │  - Funnel    │      │  gmail_backend.py       │   │  local_server_2.py  │ │
│  │  - Timeline  │      │  - OAuth 2.0 PKCE      │   │  - Agentic Pipeline │ │
│  │  - CV Upload │      │  - Gmail API queries   │   │  - Parallel GPT     │ │
│  │  - Job Recs  │      │  - Token storage       │   │  - CV Analysis      │ │
│  │  - Insights  │      └───────────┬────────────┘   │  - Job Search       │ │
│  └──────────────┘                  │                 └──────────┬──────────┘ │
│                                    │                            │             │
│                           ┌────────▼────────┐       ┌──────────▼──────────┐ │
│                           │   Google APIs   │       │ OpenAI + Adzuna API │ │
│                           │   (Gmail)       │       │ (GPT-4o-mini)       │ │
│                           └─────────────────┘       └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Agentic Processing Pipeline (Sequential → Parallel → Sequential):**
```
[Sequential]
  Step 1: OAuth Login → Token Store → Cache Check
          (Cache Hit → Immediate Response)
          (Cache Miss → continue)
  Step 2: Gmail Query → Paginated email fetch
  Step 3: Layer A Rule-Based Filter → eliminate non-job emails
  Step 4: AI Agent → extract company names from email batch

[Parallel — ThreadPoolExecutor(max_workers=10)]
  Step 5: Per-company AI agents run concurrently:
          Each agent: filter relevant emails → GPT-4o-mini → extract
          position / stage / dates / status

[Sequential]
  Step 6: Merge results, deduplicate, resolve manual entries
  Step 7: Cache write → SSE stream → Frontend render
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

#### Layer B: AI Refinement (LLM-Based)

**Purpose:** Handle ambiguous cases, extract company names from ATS emails, and provide nuanced stage classification.

**Model Configuration:**
- Model: OpenAI GPT-4o-mini
- Temperature: 0.1 (deterministic outputs)
- Max tokens: Adaptive based on email count
- Parallel processing: ThreadPoolExecutor for concurrent company analysis

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

**Incremental Update Strategy:**
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
- Merge new results with existing cache (preserving manual entries)
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

---

## 4. Frontend Visualization & UX Implementation

### 4.1 Dashboard Components

**Statistics Overview:** Total applications, had interviews, active applications

**Sankey Diagram:** Visual flow from Application → various stages → Offer/Rejection

**Application Funnel:**
```
Applied         ████████████████████████████  45 (100%)
Assessment      ██████████████                28 (62%)
Interview       ████████                      15 (33%)
Offer           ██                             3 (7%)
```
Color-coded by stage: blue=Applied, orange=Assessment, purple=Interview, green=Offer.
Labels displayed outside bars. LinkedIn share button shown inline.

**Timeline View:** Company-grouped application history with stage progression dots and rejected/active badges

**Performance Analytics:** Response rates, stage conversion rates, pending vs rejected breakdown

**Bottleneck Insights:** Auto-detects the stage with highest drop-off (min threshold: 2 applications).
Surfaces targeted HKU CEDARS resources:
- No Response → VMock CV improvement
- Failing Assessments → CEDARS Aptitude Test platform
- Stuck at Video Interview → VMock mock interview
- Not Converting Interviews → DropPicker alumni interview Q&A library

**CV Analysis:** Upload PDF/DOCX CV → AI compares against application history → improvement suggestions

**Job Recommendations:** Based on CV skills + application history → Adzuna API job search with match scoring

### 4.2 Real-Time Progress Feedback

**Fetch-Based SSE Implementation** (used instead of native EventSource to support custom headers):
```
Progress Stages:
Step 0: "Fetching email data..." (with email count)
Step 1: "Scanning for job applications..." (with application count)
Step 2: "Detecting companies..." (with company list)
Step 3: "AI analyzing [Company]... (3/10)" (per-company progress)
Step 4: "Classifying by stage..."
Step 5: "Building your dashboard..."
```

---

## 5. Integration, Testing, and Deployment

### 5.1 API Integration

**REST Endpoints:**

| Endpoint | Method | Server | Purpose |
|----------|--------|--------|---------|
| `/callback` | GET | EC2 (auth) | OAuth callback handler |
| `/status` | GET | EC2 (auth) | Check authentication status |
| `/user-info` | GET | EC2 (auth) | Get user email/profile |
| `/logout` | GET | EC2 (auth) | Clear authentication |
| `/process` | GET | EC2 | Full analysis |
| `/process-stream` | GET | EC2 | SSE progress stream |
| `/applications` | GET | EC2 | Get cached applications |
| `/applications/add` | POST | EC2 | Add manual application |
| `/applications/update` | PUT | EC2 | Edit application |
| `/applications/delete` | DELETE | EC2 | Delete application |
| `/cv/upload` | POST | EC2 | Upload and parse CV |
| `/cv/analyze` | POST | EC2 | AI CV analysis |
| `/jobs/search` | GET | EC2 | Adzuna job search |
| `/jobs/recommend` | POST | EC2 | Personalized job recommendations |
| `/chat` | POST | EC2 | AI chatbot |

### 5.2 Deployment Architecture

**Production Environment:**
```
Cloud Deployment:
├── Frontend (React/Vite) → Vercel (youraijobtracker.vercel.app)
│     └── vercel.json: rewrites all routes → index.html (SPA routing)
├── AWS EC2 t2.micro
│     ├── nginx reverse proxy (ports 80/443) + Let's Encrypt SSL (certbot)
│     │     └── jobtracker-auth.ddns.net → localhost:5678 (gmail_backend.py)
│     └── Auth Server (gmail_backend.py) — Gmail OAuth 2.0 PKCE
└── Local Machine
      ├── local_server_2.py (port 5001) — AI pipeline, job search, CV analysis
      └── Cloudflare Tunnel → exposes :5001 as public HTTPS URL
```

**Environment Variables:**
```
EC2 (~/.bashrc):
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- REDIRECT_URI (https://jobtracker-auth.ddns.net/callback)

Local Machine:
- OPENAI_API_KEY
- ADZUNA_APP_ID / ADZUNA_APP_KEY

Frontend (api.js):
- RENDER_URL: https://jobtracker-auth.ddns.net  (EC2 auth server)
- LOCAL_URL:  https://<tunnel>.trycloudflare.com  (local AI server)
```

**Server Startup:**
```bash
# EC2 — nginx starts automatically via systemd
# EC2 — start auth server
tmux new -s auth
cd ~/fyp-project/backend && python3 gmail_backend.py

# Local machine — start AI processing server
python3 backend/local_server_2.py

# Local machine — start Cloudflare tunnel
cloudflared tunnel --url http://localhost:5001
# Copy the generated URL into frontend/src/services/api.js LOCAL_URL
```

**Security Measures:**
- OAuth tokens stored server-side only (not in browser)
- CORS configured for all origins (`flask_cors`)
- No sensitive data in client-side storage
- HTTPS enforced via nginx + Let's Encrypt (auto-renewing certificates)
- OpenAI API key stored as environment variable (not in code)
- Gmail API scope limited to `gmail.readonly` (no write access)

---

## Summary

This methodology describes a systematic approach to building an automated job application tracker:

1. **Scope Definition** — Clear stage definitions, MVP + extended features, privacy boundaries, and success metrics
2. **Pipeline Design** — Two-layer classification (rule-based + AI), incremental caching, parallel processing
3. **Pattern Analysis** — Empirical email analysis, iterative rule development, edge case handling
4. **Frontend Implementation** — Dashboard visualizations, CV analysis, job recommendations, LinkedIn sharing
5. **Deployment** — Vercel (frontend) + AWS EC2 (OAuth) + Cloudflare Tunnel (AI processing)

The system prioritizes user privacy (read-only Gmail access, no raw email storage), accuracy (two-layer classification with agentic parallel processing), and actionable feedback (bottleneck detection with HKU CEDARS resource integration).
