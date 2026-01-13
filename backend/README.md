# JobTracker Backend

Email processing pipeline that extracts job application data from Gmail and tracks application progress using AI.

## Overview

The backend consists of two main filters that process emails in sequence:

```
Gmail API → firstfilter → Company Folders → secondfilter → Application Timeline
```

## Files

| File | Description |
|------|-------------|
| `firstfilter.py` | Fetches emails from Gmail, extracts company names, and organizes emails by company |
| `secondfilter.py` | Analyzes emails per company and extracts application timeline (tests, interviews, status) |
| `gmail_backend.py` | Flask server for Gmail OAuth and email fetching (deployed on Render) |
| `requirements.txt` | Python dependencies |

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Activate Gmail Backend

Visit https://gmail-login-backend.onrender.com and authenticate with Google:

1. Click "Login with Google"
2. Complete OAuth flow
3. You should see "Already authenticated! Use /query?q=..."

Note: Render free tier may spin down after inactivity. The first request may take 30-60 seconds to wake up.

### 3. Run the Pipeline

```bash
# Step 1: Fetch emails and organize by company
python firstfilter.py

# Step 2: Extract application timeline for each company
python secondfilter.py
```

## Output Structure

```
applied_companies/
├── amazon/
│   ├── emails.json           # Raw emails for this company
│   └── application_process.json  # Extracted timeline
├── bloomberg/
│   ├── emails.json
│   └── application_process.json
└── ...
```

### application_process.json Format

Supports multiple positions per company:

```json
{
  "positions": [
    {
      "position": "Software Engineer",
      "application_submitted": "2025-09-08",
      "aptitude_test": null,
      "simulation_test": null,
      "coding_test": "2025-10-14",
      "video_interview": null,
      "num_human_interview": "0",
      "app_accepted": null
    },
    {
      "position": "Product Manager",
      "application_submitted": "2025-09-08",
      "aptitude_test": null,
      "simulation_test": null,
      "coding_test": null,
      "video_interview": null,
      "num_human_interview": "0",
      "app_accepted": "n"
    }
  ]
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `position` | Job title applied for |
| `application_submitted` | Date application was submitted |
| `aptitude_test` | Date of aptitude/personality test (Plum, Pymetrics, SHL) |
| `simulation_test` | Date of job simulation (Forage, SJT) |
| `coding_test` | Date of coding assessment (HackerRank, Codility, CodeSignal) |
| `video_interview` | Date of one-way video interview (HireVue, Willo) |
| `num_human_interview` | Number of live interviews completed |
| `app_accepted` | `"y"` = offer, `"n"` = rejected, `null` = pending |

## How It Works

### First Filter (`firstfilter.py`)

1. Fetches all job-related emails from Gmail using query:
   ```
   subject:("application" OR "applying" OR "apply" OR "applied") in:inbox after:2025/08/01
   ```

2. Uses GPT to extract company names from email subjects/senders

3. For each company, builds a strict query to fetch only relevant emails:
   - Subject matching
   - Domain matching (excludes ATS domains like workday.com, greenhouse.io)
   - Validates emails using body content

4. Saves emails to `applied_companies/{company}/emails.json`

### Second Filter (`secondfilter.py`)

1. Loads emails for each company

2. Pre-processes emails:
   - Filters noise (marketing, support tickets)
   - Deduplicates by subject (keeps rejection emails separate)
   - Sorts chronologically

3. Pre-detects stages using regex patterns:
   - Application confirmation keywords
   - Test platform names (HackerRank, Plum, HireVue, etc.)
   - Interview scheduling phrases
   - Rejection phrases

4. Sends compact email summary + body snippets to GPT for analysis

5. GPT extracts:
   - All positions applied to
   - Timeline for each position
   - Status (pending/rejected/offer)

6. Saves to `applied_companies/{company}/application_process.json`

## Key Features

- **Multi-position tracking**: Handles multiple job applications at the same company
- **Accurate rejection detection**: Only marks rejected if the specific position was rejected
- **Recursive body parsing**: Extracts email body from nested MIME structures
- **Token optimization**: Pre-detection reduces GPT token usage by ~60%
- **Smart deduplication**: Keeps emails with different content types (rejection vs non-rejection)

## Gmail Backend Deployment

To deploy your own Gmail backend on Render:

1. Create a new Web Service on Render
2. Upload `gmail_backend.py`
3. Set environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `REDIRECT_URI` (e.g., `https://your-app.onrender.com/callback`)
4. Set up Google Cloud OAuth credentials with the redirect URI

## Configuration

### Azure OpenAI

Update credentials in both filter files:
```python
client = AzureOpenAI(
    azure_endpoint="YOUR_ENDPOINT",
    api_key="YOUR_API_KEY",
    api_version="2025-01-01-preview"
)
MODEL = "gpt-4o-mini"
```

### Gmail Query Date Range

Modify the date filter in `firstfilter.py`:
```python
query = 'subject:("application" OR ...) in:inbox after:2025/08/01'
```

## Dependencies

- `requests>=2.32.0` - HTTP requests
- `openai>=2.14.0` - Azure OpenAI SDK
- `flask` - Gmail backend server (for Render deployment)
- `google-auth-oauthlib` - Gmail OAuth
- `google-api-python-client` - Gmail API
