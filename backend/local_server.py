"""
Local processing server for JobTracker AI.
Uses EXACT logic from firstfilter.py and secondfilter.py.
- Fetches emails from Render's /query endpoint
- Runs firstfilter + secondfilter logic locally
- Returns processed data to frontend
- JSON file caching with 24-hour TTL
"""
import os
import re
import json
import time
import hashlib
import requests
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import queue
import threading
from openai import AzureOpenAI

app = Flask(__name__)
CORS(app)

# Render backend URL for fetching emails
RENDER_URL = "https://gmail-login-backend.onrender.com"

# =========================
# CACHE CONFIGURATION (Permanent, Date-Range Aware)
# =========================
CACHE_FILE = os.path.join(os.path.dirname(__file__), "cache.json")


def load_cache():
    """Load cache from JSON file"""
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_cache(cache):
    """Save cache to JSON file"""
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f, indent=2)
    except IOError as e:
        print(f"Warning: Could not save cache: {e}")


def get_user_email():
    """Get the authenticated user's email from Render"""
    try:
        resp = requests.get(f"{RENDER_URL}/user-info", timeout=10)
        if resp.status_code == 200:
            return resp.json().get("email", "unknown")
    except:
        pass
    return "unknown"


def get_user_cache(user_email):
    """
    Get cached data for a user (permanent cache with date range metadata).

    Cache structure per user:
    {
        "earliest_date": "2024-01-01",  # oldest date in cache
        "latest_date": "2025-01-06",    # newest date in cache
        "companies": [...],
        "total_companies": N,
        "total_applications": N,
        "timestamp": ...,  # last update time (for reference only)
    }
    """
    cache = load_cache()
    return cache.get(user_email)


def save_user_cache(user_email, earliest_date, latest_date, companies, total_companies, total_applications):
    """Save cached data for a user with date range metadata"""
    cache = load_cache()

    cache[user_email] = {
        "earliest_date": earliest_date,
        "latest_date": latest_date,
        "companies": companies,
        "total_companies": total_companies,
        "total_applications": total_applications,
        "timestamp": time.time()
    }

    save_cache(cache)
    print(f"\n💾 CACHE SAVE:")
    print(f"   User: {user_email}")
    print(f"   Date range: {earliest_date} to {latest_date}")
    print(f"   Companies: {total_companies}, Applications: {total_applications}")


def merge_company_data(existing_companies, new_companies):
    """
    Merge new company data into existing cache.
    - Same company: merge positions (avoid duplicates based on position name + applied date)
    - New company: add to list
    - IMPORTANT: Preserve all manual entries (positions and companies marked as manual=True)
    """
    # Build map from existing, preserving manual entries
    company_map = {}
    for c in existing_companies:
        company_map[c["name"].lower()] = {
            **c,
            "name": c["name"],  # Preserve original casing
        }

    for new_co in new_companies:
        name_lower = new_co["name"].lower()
        if name_lower in company_map:
            existing_co = company_map[name_lower]

            # Get existing positions, separating manual from AI-detected
            existing_positions = existing_co.get("positions", [])
            manual_positions = [p for p in existing_positions if p.get("manual", False)]
            ai_positions = [p for p in existing_positions if not p.get("manual", False)]

            # Build keys for existing AI positions
            ai_keys = {
                (p.get("position", "").lower(), p.get("application_submitted", ""))
                for p in ai_positions
            }

            # Add new AI-detected positions (avoid duplicates)
            for new_pos in new_co["positions"]:
                if new_pos.get("manual", False):
                    continue  # Skip if somehow marked manual
                key = (new_pos.get("position", "").lower(), new_pos.get("application_submitted", ""))
                if key not in ai_keys:
                    ai_positions.append(new_pos)
                    ai_keys.add(key)

            # Combine: AI positions + manual positions (manual always preserved)
            company_map[name_lower]["positions"] = ai_positions + manual_positions

            # Update email count (only from AI detection)
            company_map[name_lower]["email_count"] = max(
                existing_co.get("email_count", 0),
                new_co.get("email_count", 0)
            )

            # Preserve manual flag if company was manually added
            if existing_co.get("manual", False):
                company_map[name_lower]["manual"] = True
        else:
            # New company from AI - add it
            company_map[name_lower] = new_co

    # Also ensure any manual-only companies from existing are preserved
    for c in existing_companies:
        name_lower = c["name"].lower()
        if c.get("manual", False) and name_lower not in company_map:
            company_map[name_lower] = c

    merged = list(company_map.values())
    total_applications = sum(len(c["positions"]) for c in merged)

    return merged, len(merged), total_applications


def check_cache_coverage(user_email, requested_start, requested_end):
    """
    Check if cache covers the requested date range.

    Returns:
    - ("full", cached_data) - Cache fully covers requested range
    - ("extend_earlier", cached_data, fetch_start, fetch_end) - Need to fetch earlier dates
    - ("extend_later", cached_data, fetch_start, fetch_end) - Need to fetch newer dates
    - ("partial", cached_data, gaps) - Multiple gaps (complex case)
    - (None, None) - No cache exists
    """
    cached = get_user_cache(user_email)

    if not cached:
        print(f"   ❌ Cache MISS - no data for user")
        return None, None

    cached_earliest = cached.get("earliest_date")
    cached_latest = cached.get("latest_date")

    print(f"\n📦 CACHE CHECK:")
    print(f"   User: {user_email}")
    print(f"   Cached range: {cached_earliest} to {cached_latest}")
    print(f"   Requested range: {requested_start} to {requested_end}")

    # Normalize dates for comparison
    req_start = requested_start or "2000-01-01"  # Very early if no start
    req_end = requested_end or time.strftime("%Y-%m-%d")  # Today if no end
    cache_start = cached_earliest or "2000-01-01"
    cache_end = cached_latest or time.strftime("%Y-%m-%d")

    # Check coverage
    if req_start >= cache_start and req_end <= cache_end:
        print(f"   ✅ Cache FULL HIT - covers entire requested range")
        return "full", cached

    if req_start < cache_start:
        print(f"   📅 Need to fetch EARLIER dates: {req_start} to {cache_start}")
        return "extend_earlier", cached, req_start, cache_start

    if req_end > cache_end:
        print(f"   📅 Need to fetch LATER dates: {cache_end} to {req_end}")
        return "extend_later", cached, cache_end, req_end

    # Should not reach here with simple logic
    print(f"   ⚠️ Complex cache gap - fetching full range")
    return None, None

# Azure OpenAI Configuration (same as original scripts)
client = AzureOpenAI(
    azure_endpoint="https://api-iw.azure-api.net/sig-shared-jpeast/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
    api_key="72fc700a6bd24963b8e4cf5d28d4e95c",
    api_version="2025-01-01-preview"
)
MODEL = "gpt-4o-mini"

# =========================
# FROM FIRSTFILTER.PY
# =========================
GENERIC_TOKENS = {
    "group", "teams", "page", "career", "careers", "jobs", "job",
    "recruit", "recruiting", "recruitment", "talent", "hr", "hiring",
    "global", "international", "asia", "apac", "hk", "hong", "kong",
    "limited", "ltd", "inc", "corp", "corporation", "company",
    "graduate", "analyst", "engineer", "program", "programme"
}

ATS_DOMAINS = {
    "workday.com", "myworkday.com", "greenhouse.io", "greenhouse-mail.io",
    "lever.co", "hire.lever.co", "tal.net", "brassring.com",
    "hackerrankforwork.com", "hirevue.com", "hirevue-app.eu"
}

# =========================
# FROM SECONDFILTER.PY
# =========================
SKIP_PATTERNS = [
    r"zendesk\.com",
    r"Ticket\s*#\d+",
    r"We are waiting for your response",
    r"theforage\.com.*Build skills",
    r"Your Cluely Digest",
    r"Latest.*jobs.*in",
    r"New jobs for:",
    r"Welcome to .* Office$",
    r"Event Reminder",
    r"Your registration for Virtual",
    r"days left to complete",
    r"credly\.com",
]

STAGE_PATTERNS = {
    "application_submitted": [
        r"thank you for (applying|your application)",
        r"we've received your application",
        r"application (received|submitted)",
        r"thanks for applying",
    ],
    "aptitude_test": [
        r"plum",
        r"pymetrics",
        r"shl\.com",
        r"talent.*assessment",
        r"psychometric",
        r"behavioral.*assessment",
        r"personality.*assessment",
    ],
    "simulation_test": [
        r"simulate",
        r"simulation",
        r"forage",
        r"job.*preview",
        r"situational.*judgment|sjt",
    ],
    "coding_test": [
        r"hackerrank",
        r"codesignal",
        r"codility",
        r"coding.*(test|assessment|challenge)",
        r"technical.*assessment",
        r"take.*home.*assignment",
    ],
    "video_interview": [
        r"hirevue",
        r"willo",
        r"pre-recorded.*video",
        r"one-way.*video",
        r"record your (answer|response)",
    ],
    "human_interview": [
        r"interview.*(scheduled|confirmation|invitation)",
        r"assessment centre",
        r"super day",
        r"meet with",
        r"speak with you",
    ],
    "rejection": [
        r"not.*(proceed|move forward|moving forward)",
        r"unfortunately",
        r"will not be",
        r"decided not to proceed",
        r"regret to inform",
    ],
    "offer": [
        r"(pleased|delighted) to offer",
        r"offer letter",
        r"congratulations.*offer",
    ],
}

BAD_POSITION_PATTERNS = [
    "job title", "actual job title", "empty string", "role at",
    "thank you for", "we've received", "we have received",
    "your application", "application received"
]


# =========================
# HELPER FUNCTIONS
# =========================
def extract_json(text):
    """Extract JSON from GPT response (from secondfilter.py)"""
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass

    start = text.find("{")
    if start == -1:
        return {}

    depth = 0
    for i, char in enumerate(text[start:], start):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i+1])
                except:
                    break
    return {}


def clean_domain(email):
    """Extract domain from email address (from firstfilter.py)"""
    if not email:
        return ""
    s = email.strip()
    if "<" in s and ">" in s:
        s = s.split("<", 1)[1].split(">", 1)[0]
    if "@" in s:
        s = s.split("@", 1)[1]
    return s.lower().strip(">").strip('"').strip("'")


def parse_date(date_str):
    """Normalize date to YYYY-MM-DD format (from secondfilter.py)"""
    if not date_str:
        return None

    # ISO format: 2025-10-02T03:43:14+00:00
    match = re.search(r"(\d{4}-\d{2}-\d{2})", date_str)
    if match:
        return match.group(1)

    # RFC format: Mon, 03 Nov 2025 21:43:20 +0000
    try:
        from datetime import datetime
        # Remove timezone info for parsing
        clean = re.sub(r'\s*\([^)]*\)\s*$', '', date_str)  # Remove (UTC) etc
        clean = re.sub(r'\s*[+-]\d{4}\s*$', '', clean)     # Remove +0000 etc
        clean = clean.strip()

        for fmt in [
            "%a, %d %b %Y %H:%M:%S",
            "%d %b %Y %H:%M:%S",
        ]:
            try:
                dt = datetime.strptime(clean, fmt)
                return dt.strftime("%Y-%m-%d")
            except:
                continue
    except:
        pass

    return None


def should_skip(email):
    """Check if email should be skipped (from secondfilter.py)"""
    subject = email.get("subject", "").lower()
    from_email = email.get("from_email", "").lower()
    text = f"{subject} {from_email}"

    for pattern in SKIP_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def detect_stages(email):
    """Pre-detect stages using regex (from secondfilter.py)"""
    subject = email.get("subject", "").lower()
    from_email = email.get("from_email", "").lower()
    body = email.get("body", "").lower()[:500]
    text = f"{subject} {from_email} {body}"

    detected = []
    for stage, patterns in STAGE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                detected.append(stage)
                break
    return detected


def deduplicate_emails(emails):
    """Remove duplicates, keeping rejections separate (from secondfilter.py)"""
    seen = set()
    unique = []
    rejection_phrases = ["regret to inform", "will not be moving forward", "not proceed", "unfortunately"]

    for email in emails:
        subject = email.get("subject", "")
        body = email.get("body", "").lower()[:500]
        normalized = re.sub(r"^(re:|fwd:|fw:)\s*", "", subject.lower(), flags=re.IGNORECASE).strip()
        is_rejection = any(phrase in body for phrase in rejection_phrases)
        key = (normalized[:60], is_rejection)

        if key not in seen:
            seen.add(key)
            unique.append(email)

    return unique


def clean_body_text(body):
    """Clean body text for GPT (from secondfilter.py)"""
    if not body:
        return ""
    text = re.sub(r'\s+', ' ', body).strip()
    text = re.sub(r'(unsubscribe|privacy policy|terms of service|view in browser).*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'https?://\S+', '[link]', text)
    if len(text) > 300:
        text = text[:300] + "..."
    return text


def format_compact(emails):
    """Format emails for GPT with body (from secondfilter.py)"""
    lines = []
    for e in emails:
        date = parse_date(e.get("date", "")) or "?"
        subject = e.get("subject", "")[:80]
        from_email = e.get("from_email", "")
        domain_match = re.search(r"@([^>\s]+)", from_email)
        domain = domain_match.group(1)[:25] if domain_match else "?"
        stages = detect_stages(e)
        stage_str = f" [{','.join(stages)}]" if stages else ""
        body = clean_body_text(e.get("body", ""))
        body_str = f"\n   Body: {body}" if body else ""
        lines.append(f"{date} | {domain} | {subject}{stage_str}{body_str}")
    return "\n".join(lines)


def build_strict_query(company, all_messages, date_filter=""):
    """
    Build a STRICT Gmail query for a company (from firstfilter.py).
    Key improvements:
    1. Only use meaningful tokens (filter out generic ones)
    2. Prioritize exact company name matches
    3. Use domain matching only for company-specific domains
    """
    company_lower = company.lower().strip()

    # Tokenize company name
    raw_tokens = re.split(r"[\s,\-_/&.]+", company_lower)
    tokens = [t for t in raw_tokens if t and len(t) > 1]

    # Filter out generic tokens
    meaningful_tokens = [t for t in tokens if t not in GENERIC_TOKENS]

    # If no meaningful tokens left, use full company name only
    if not meaningful_tokens:
        meaningful_tokens = [company_lower.replace(" ", "")]

    query_parts = []

    # 1) EXACT subject match (highest priority)
    query_parts.append(f'subject:"{company}"')

    # 2) Subject with meaningful tokens (AND not OR for multiple tokens)
    if len(meaningful_tokens) >= 2:
        token_query = " ".join([f"subject:{t}" for t in meaningful_tokens[:2]])
        query_parts.append(f"({token_query})")
    elif meaningful_tokens:
        query_parts.append(f"subject:{meaningful_tokens[0]}")

    # 3) Domain-based matching (only for company-specific domains)
    company_domains = set()
    for m in all_messages:
        fe = m.get("from_email", "").lower()
        if "@" in fe:
            domain = fe.split("@")[-1].split(">")[0].strip()
            is_ats = any(ats in domain for ats in ["workday", "greenhouse", "lever", "brassring", "hirevue", "hackerrank"])
            if not is_ats:
                for token in meaningful_tokens:
                    if token in domain and len(token) >= 3:
                        company_domains.add(domain)
                        break

    if company_domains:
        domain_query = " OR ".join([f"from:{d}" for d in company_domains])
        query_parts.append(f"({domain_query})")

    # 4) HackerRank/Codility emails with company name in subject
    query_parts.append(f'(from:hackerrankforwork.com subject:"{company}")')
    query_parts.append(f'(from:codility.com subject:"{company}")')

    # Combine with OR
    combined = " OR ".join(query_parts)

    # Add date filter and inbox
    final_query = f"({combined}) in:inbox{date_filter}"

    return final_query


def validate_emails_for_company(company, emails):
    """Filter emails to only include those for this company (from firstfilter.py)"""
    company_lower = company.lower()
    tokens = re.split(r"[\s,\-_/&.]+", company_lower)
    meaningful_tokens = [t for t in tokens if t and t not in GENERIC_TOKENS and len(t) > 2]

    validated = []
    for email in emails:
        subject = email.get("subject", "").lower()
        from_email = email.get("from_email", "").lower()
        body = email.get("body", "").lower()[:1000]

        subject_match = company_lower in subject or any(t in subject for t in meaningful_tokens if len(t) >= 4)
        domain = clean_domain(from_email)
        domain_match = any(t in domain for t in meaningful_tokens if len(t) >= 3)
        body_match = company_lower in body or any(t in body for t in meaningful_tokens if len(t) >= 4)

        is_ats = any(ats in domain for ats in ["workday", "greenhouse", "lever", "brassring", "hirevue", "hackerrank", "tal.net"])
        if is_ats:
            if subject_match or body_match:
                validated.append(email)
        elif subject_match or domain_match:
            validated.append(email)

    return validated


def fetch_emails_from_render(query, max_loops=10):
    """Fetch emails from Render with pagination (from firstfilter.py)"""
    all_msgs = []
    next_page = None

    for _ in range(max_loops):
        url = f"{RENDER_URL}/query"
        params = {"q": query, "format": "full"}
        if next_page:
            params["page_token"] = next_page

        print(f"  Fetching: {url}")
        resp = requests.get(url, params=params, timeout=60)
        if resp.status_code != 200:
            print(f"  Error: {resp.status_code}")
            break

        data = resp.json()
        msgs = data.get("messages", [])
        all_msgs.extend(msgs)

        next_page = data.get("next_page_token")
        if not next_page:
            break

    return all_msgs


# =========================
# ROUTES
# =========================
@app.route('/')
def index():
    return jsonify({
        "status": "Local processing server running",
        "cache_type": "Permanent (no TTL) with incremental date updates",
        "endpoints": [
            "/process - Process emails (uses cached data if available)",
            "/process?refresh=true - Fetch new emails since last cache update",
            "/process?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD - Fetch specific date range",
            "/process-stream - Same as /process but with SSE progress events",
            "/status - Check auth status",
            "/cache-info - View cached date ranges per user",
            "/clear-cache - Clear all cached data"
        ]
    })


@app.route('/status')
def status():
    """Proxy to Render's status endpoint"""
    try:
        resp = requests.get(f"{RENDER_URL}/status")
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"authenticated": False, "error": str(e)})


@app.route('/clear-cache')
def clear_cache():
    """Clear the entire cache"""
    try:
        if os.path.exists(CACHE_FILE):
            os.remove(CACHE_FILE)
            return jsonify({"success": True, "message": "Cache cleared"})
        return jsonify({"success": True, "message": "Cache was already empty"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/cache-info')
def cache_info():
    """Get information about cached entries (per user, permanent cache)"""
    cache = load_cache()
    entries = []
    current_time = time.time()

    for user_email, entry in cache.items():
        cached_time = entry.get("timestamp", 0)
        age_hours = (current_time - cached_time) / 3600
        entries.append({
            "user": user_email,
            "earliest_date": entry.get("earliest_date"),
            "latest_date": entry.get("latest_date"),
            "last_updated_hours_ago": round(age_hours, 1),
            "companies": entry.get("total_companies", 0),
            "applications": entry.get("total_applications", 0)
        })

    return jsonify({
        "cache_type": "permanent (no TTL)",
        "total_users": len(entries),
        "entries": entries
    })


def process_with_progress(start_date, end_date, progress_callback=None):
    """
    Core processing logic that can emit progress events.
    progress_callback(step, message, data) is called at each stage.
    Returns the final result.
    """
    def emit(step, message, data=None):
        if progress_callback:
            progress_callback(step, message, data or {})
        print(f"  [{step}] {message}")

    # Check auth
    try:
        auth_resp = requests.get(f"{RENDER_URL}/status")
        if not auth_resp.json().get("authenticated"):
            return {"error": "Not authenticated on Render", "authenticated": False}
    except Exception as e:
        return {"error": f"Cannot reach Render: {e}"}

    try:
        # =========================
        # STEP 1: FETCH EMAILS
        # =========================
        emit(0, "Fetching email data...")

        # Build date filter for Gmail query
        date_filter = ""
        if start_date:
            date_filter += f" after:{start_date.replace('-', '/')}"
        if end_date:
            date_filter += f" before:{end_date.replace('-', '/')}"

        if not date_filter:
            date_filter = " after:2025/06/06"

        query = f'subject:("application" OR "applying" OR "apply" OR "applied") in:inbox{date_filter}'
        all_emails = fetch_emails_from_render(query)

        if not all_emails:
            return {"companies": [], "total_companies": 0, "total_applications": 0}

        emit(0, f"Found {len(all_emails)} emails", {"email_count": len(all_emails)})

        # =========================
        # STEP 2: SCAN FOR APPLICATIONS
        # =========================
        emit(1, "Scanning for job applications...")

        seen, slim = set(), []
        for m in all_emails:
            fe = (m.get("from_email") or "").strip()
            sj = (m.get("subject") or "").strip()
            key = (fe.lower(), sj.lower())
            if fe and sj and key not in seen:
                seen.add(key)
                slim.append({"from_email": fe, "subject": sj})

        emit(1, f"Found {len(slim)} unique applications", {"application_count": len(slim)})

        # =========================
        # STEP 3: DETECT COMPANIES
        # =========================
        emit(2, "Detecting companies...")

        lines = []
        for m in slim[:100]:
            dom = clean_domain(m["from_email"])
            subj = m["subject"][:160]
            lines.append(f"{dom} | {subj}")

        company_prompt = f"""Below are job-related emails as 'from_domain | subject'.
Extract the REAL company names the user applied to.

IMPORTANT:
- ATS domains (lever.co, workday.com, greenhouse.io, tal.net) are NOT companies.
  Extract the real company from the SUBJECT.
- Examples:
  - "hire.lever.co | Thank you for application to ION Group" → "ION Group"
  - "blackrock.tal.net | BlackRock | Application update" → "BlackRock"
  - "myworkday.com | Thank You for Applying to MUFG" → "MUFG"
  - "noreply@mail.hirevue-app.eu | Video interview for UBS" → "UBS"

Return JSON: {{"companies_applied":["Company1","Company2",...]}}

Emails:
```
{chr(10).join(lines)}
```"""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You extract company names from job application emails."},
                {"role": "user", "content": company_prompt}
            ]
        )

        companies_raw = extract_json(response.choices[0].message.content or "").get("companies_applied", [])

        clean_prompt = f"""Clean this list of company names:

1. REMOVE non-companies: "BAE", "KIM", "WORKDAY", "GREENHOUSE", "LEVER", generic names
2. NORMALIZE: "Morgan Stanley HK" → "Morgan Stanley", "Bloomberg L.P." → "Bloomberg"
3. MERGE duplicates
4. IMPORTANT: Keep "UBS" and "ION Group" as SEPARATE companies (they are different!)

Input: {companies_raw}
Output JSON: {{"clean_companies": ["Company1", "Company2", ...]}}"""

        resp2 = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You clean and deduplicate company names."},
                {"role": "user", "content": clean_prompt}
            ]
        )

        companies = extract_json(resp2.choices[0].message.content or "").get("clean_companies", companies_raw)
        companies = companies[:15]  # Limit to 15

        emit(2, f"Detected {len(companies)} companies", {"companies": companies, "company_count": len(companies)})

        # =========================
        # STEP 4: AI ANALYZING (per company)
        # =========================
        results = []
        total_companies = len(companies)

        for idx, company in enumerate(companies):
            emit(3, f"AI analyzing {company}... ({idx + 1}/{total_companies})", {
                "current_company": company,
                "progress": idx + 1,
                "total": total_companies
            })

            company_query = build_strict_query(company, all_emails, date_filter)
            company_raw_emails = fetch_emails_from_render(company_query)
            company_emails = validate_emails_for_company(company, company_raw_emails)

            if not company_emails:
                continue

            filtered = [e for e in company_emails if not should_skip(e)]
            filtered.sort(key=lambda x: parse_date(x.get("date", "")) or "9999")
            unique = deduplicate_emails(filtered)

            if not unique:
                continue

            # Pre-detect stages
            pre_detected = {
                "application_submitted": None,
                "aptitude_test": None,
                "simulation_test": None,
                "coding_test": None,
                "video_interview": None,
                "human_interview_dates": [],
                "rejection": None,
                "offer": None,
            }

            for email in unique:
                date = parse_date(email.get("date", ""))
                stages = detect_stages(email)
                for stage in stages:
                    if stage == "human_interview":
                        if date and date not in pre_detected["human_interview_dates"]:
                            pre_detected["human_interview_dates"].append(date)
                    elif stage in pre_detected:
                        if date and pre_detected[stage] is None:
                            pre_detected[stage] = date

            compact_text = format_compact(unique[:15])

            pre_detected_hints = []
            if pre_detected["rejection"]:
                pre_detected_hints.append(f"REJECTION detected on {pre_detected['rejection']}")
            if pre_detected["offer"]:
                pre_detected_hints.append(f"OFFER detected on {pre_detected['offer']}")
            pre_hint_str = "\n".join(pre_detected_hints) if pre_detected_hints else ""

            analysis_prompt = f"""Analyze job application emails for "{company}".

EMAILS (date | sender | subject [pre-detected stages]):
{compact_text}

{f"PRE-DETECTED STATUS: {pre_hint_str}" if pre_hint_str else ""}

CRITICAL RULES:
1. POSITION: Extract the actual JOB TITLE (e.g., "Graduate Software Engineer", "Analyst Program 2026", "Data Scientist").
   - Look for patterns like "applying for [POSITION]", "application for [POSITION]", "Thank you for applying to [POSITION]"
   - NEVER use generic phrases like "Thank you for your application", "We've received your application", "role at X"

2. MULTIPLE POSITIONS: If the candidate applied to MULTIPLE different positions at this company, return ALL of them as separate entries in the "positions" array. Each position should have its own timeline and status.

3. "video_interview" = ONE-WAY pre-recorded video (HireVue, Willo) only. Phone calls and live video calls are human_interviews.

4. Count human interviews: same event on same day = 1, different days = multiple. "Super Day" = 1 event.

5. "status": For EACH position separately - "rejected" if that specific position was rejected, "offer" if offered, "pending" otherwise.

OUTPUT JSON only (array of positions):
{{"positions":[{{"position":"Job Title","applied":"YYYY-MM-DD","aptitude_test":"YYYY-MM-DD or null","simulation_test":"YYYY-MM-DD or null","coding_test":"YYYY-MM-DD or null","video_interview":"YYYY-MM-DD or null","human_interviews":N,"status":"pending|rejected|offer"}}]}}"""

            try:
                analysis = client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": "You are a precise job application timeline extractor. Output valid JSON only."},
                        {"role": "user", "content": analysis_prompt}
                    ],
                    temperature=0.1
                )

                result = extract_json(analysis.choices[0].message.content or "")
                positions = result.get("positions", [])

                if not positions and result.get("position"):
                    positions = [result]

                if not positions:
                    continue

                final_positions = []
                for i, pos in enumerate(positions):
                    position_name = pos.get("position", "")
                    if any(bad in position_name.lower() for bad in BAD_POSITION_PATTERNS):
                        position_name = ""

                    use_predetected = (i == 0)

                    final_pos = {
                        "position": position_name,
                        "application_submitted": pos.get("applied") or (pre_detected["application_submitted"] if use_predetected else None),
                        "aptitude_test": pos.get("aptitude_test") if pos.get("aptitude_test") not in [None, "null", ""] else (pre_detected["aptitude_test"] if use_predetected else None),
                        "simulation_test": pos.get("simulation_test") if pos.get("simulation_test") not in [None, "null", ""] else (pre_detected["simulation_test"] if use_predetected else None),
                        "coding_test": pos.get("coding_test") if pos.get("coding_test") not in [None, "null", ""] else (pre_detected["coding_test"] if use_predetected else None),
                        "video_interview": pos.get("video_interview") if pos.get("video_interview") not in [None, "null", ""] else (pre_detected["video_interview"] if use_predetected else None),
                        "num_human_interview": str(pos.get("human_interviews", 0) or (len(pre_detected["human_interview_dates"]) if use_predetected else 0)),
                        "app_accepted": (
                            "y" if pos.get("status") == "offer" else
                            ("n" if pos.get("status") == "rejected" else None)
                        )
                    }

                    for key in final_pos:
                        if final_pos[key] == "null":
                            final_pos[key] = None

                    final_positions.append(final_pos)

                if final_positions:
                    results.append({
                        "name": company,
                        "positions": final_positions,
                        "email_count": len(company_emails)
                    })

            except Exception as e:
                print(f"  ❌ Error analyzing {company}: {e}")
                continue

        # =========================
        # STEP 5: CLASSIFYING
        # =========================
        emit(4, "Classifying by stage...")

        # =========================
        # STEP 6: BUILDING DASHBOARD
        # =========================
        total_applications = sum(len(c["positions"]) for c in results)
        emit(5, f"Building your dashboard... ({len(results)} companies, {total_applications} applications)", {
            "companies_found": len(results),
            "applications_found": total_applications
        })

        return {
            "companies": results,
            "total_companies": len(results),
            "total_applications": total_applications,
            "from_cache": False
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@app.route('/process-stream')
def process_stream():
    """
    SSE endpoint for real-time progress updates during email processing.
    Uses incremental caching - only fetches dates not already in cache.
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    force_refresh = request.args.get('refresh', '').lower() == 'true'

    # Default: last 12 months if no dates specified
    if not start_date and not end_date:
        from datetime import datetime, timedelta
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")

    user_email = get_user_email()

    print(f"\n{'='*60}")
    print(f"📥 /process-stream SSE REQUEST")
    print(f"   user: '{user_email}'")
    print(f"   start_date: '{start_date}'")
    print(f"   end_date: '{end_date}'")
    print(f"   refresh: {force_refresh}")
    print(f"{'='*60}")

    # Check cache coverage
    coverage_result = check_cache_coverage(user_email, start_date, end_date)
    coverage_type = coverage_result[0] if coverage_result else None
    cached_data = coverage_result[1] if len(coverage_result) > 1 else None

    # Handle refresh: fetch from cached_latest to today
    if force_refresh and cached_data:
        from datetime import datetime
        fetch_start = cached_data.get("latest_date", start_date)
        fetch_end = datetime.now().strftime("%Y-%m-%d")
        coverage_type = "extend_later"
        print(f"   🔄 REFRESH: fetching {fetch_start} to {fetch_end}")
    elif coverage_type == "full" and not force_refresh:
        # Full cache hit - return immediately
        cached_response = {
            "companies": cached_data.get("companies", []),
            "total_companies": cached_data.get("total_companies", 0),
            "total_applications": cached_data.get("total_applications", 0),
            "from_cache": True,
            "cached_range": {
                "earliest": cached_data.get("earliest_date"),
                "latest": cached_data.get("latest_date")
            }
        }

        def generate_cached():
            yield f"data: {json.dumps({'type': 'cached', 'data': cached_response})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'data': cached_response})}\n\n"

        return Response(generate_cached(), mimetype='text/event-stream',
                       headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

    # Determine what dates to fetch
    if coverage_type == "extend_earlier":
        fetch_start = coverage_result[2]
        fetch_end = coverage_result[3]
    elif coverage_type == "extend_later":
        fetch_start = coverage_result[2] if len(coverage_result) > 2 else cached_data.get("latest_date", start_date)
        fetch_end = coverage_result[3] if len(coverage_result) > 3 else end_date
    else:
        # No cache or complex gap - fetch full range
        fetch_start = start_date
        fetch_end = end_date

    def generate():
        progress_queue = queue.Queue()

        def progress_callback(step, message, data):
            progress_queue.put({
                "type": "progress",
                "step": step,
                "message": message,
                "data": data
            })

        result_holder = [None]

        def run_processing():
            result_holder[0] = process_with_progress(fetch_start, fetch_end, progress_callback)
            progress_queue.put(None)  # Signal completion

        thread = threading.Thread(target=run_processing)
        thread.start()

        while True:
            try:
                item = progress_queue.get(timeout=60)
                if item is None:
                    break
                yield f"data: {json.dumps(item)}\n\n"
            except queue.Empty:
                yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

        thread.join()

        result = result_holder[0]
        if result and "error" not in result:
            new_companies = result.get("companies", [])

            # Merge with existing cache if applicable
            if cached_data and coverage_type in ("extend_earlier", "extend_later"):
                existing_companies = cached_data.get("companies", [])
                merged_companies, total_cos, total_apps = merge_company_data(existing_companies, new_companies)

                # Update date range
                if coverage_type == "extend_earlier":
                    new_earliest = fetch_start
                    new_latest = cached_data.get("latest_date", fetch_end)
                else:  # extend_later
                    new_earliest = cached_data.get("earliest_date", fetch_start)
                    new_latest = fetch_end

                # Save merged cache
                save_user_cache(user_email, new_earliest, new_latest, merged_companies, total_cos, total_apps)

                result = {
                    "companies": merged_companies,
                    "total_companies": total_cos,
                    "total_applications": total_apps,
                    "from_cache": False,
                    "incremental_update": True,
                    "cached_range": {"earliest": new_earliest, "latest": new_latest}
                }
            else:
                # Fresh cache
                save_user_cache(
                    user_email,
                    start_date or fetch_start,
                    end_date or fetch_end,
                    new_companies,
                    result.get("total_companies", 0),
                    result.get("total_applications", 0)
                )
                result["cached_range"] = {"earliest": start_date, "latest": end_date}

        yield f"data: {json.dumps({'type': 'done', 'data': result})}\n\n"

    return Response(generate(), mimetype='text/event-stream',
                   headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


@app.route('/process')
def process():
    """
    Main endpoint using EXACT logic from firstfilter.py + secondfilter.py
    Uses incremental caching - only fetches dates not already in cache.
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    force_refresh = request.args.get('refresh', '').lower() == 'true'

    # Default: last 12 months if no dates specified
    if not start_date and not end_date:
        from datetime import datetime, timedelta
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")

    user_email = get_user_email()

    print(f"\n{'='*60}")
    print(f"📥 /process REQUEST")
    print(f"   user: '{user_email}'")
    print(f"   start_date: '{start_date}'")
    print(f"   end_date: '{end_date}'")
    print(f"   refresh: {force_refresh}")
    print(f"{'='*60}")

    # Check cache coverage
    coverage_result = check_cache_coverage(user_email, start_date, end_date)
    coverage_type = coverage_result[0] if coverage_result else None
    cached_data = coverage_result[1] if len(coverage_result) > 1 else None

    # Handle refresh: fetch from cached_latest to today
    if force_refresh and cached_data:
        from datetime import datetime
        fetch_start = cached_data.get("latest_date", start_date)
        fetch_end = datetime.now().strftime("%Y-%m-%d")
        coverage_type = "extend_later"
    elif coverage_type == "full" and not force_refresh:
        # Full cache hit
        return jsonify({
            "companies": cached_data.get("companies", []),
            "total_companies": cached_data.get("total_companies", 0),
            "total_applications": cached_data.get("total_applications", 0),
            "from_cache": True,
            "cached_range": {
                "earliest": cached_data.get("earliest_date"),
                "latest": cached_data.get("latest_date")
            }
        })

    # Determine what dates to fetch
    if coverage_type == "extend_earlier":
        fetch_start = coverage_result[2]
        fetch_end = coverage_result[3]
    elif coverage_type == "extend_later":
        fetch_start = coverage_result[2] if len(coverage_result) > 2 else cached_data.get("latest_date", start_date)
        fetch_end = coverage_result[3] if len(coverage_result) > 3 else end_date
    else:
        fetch_start = start_date
        fetch_end = end_date

    result = process_with_progress(fetch_start, fetch_end)

    if "error" in result:
        return jsonify(result), 500 if "Cannot reach" in result.get("error", "") else 401

    new_companies = result.get("companies", [])

    # Merge with existing cache if applicable
    if cached_data and coverage_type in ("extend_earlier", "extend_later"):
        existing_companies = cached_data.get("companies", [])
        merged_companies, total_cos, total_apps = merge_company_data(existing_companies, new_companies)

        if coverage_type == "extend_earlier":
            new_earliest = fetch_start
            new_latest = cached_data.get("latest_date", fetch_end)
        else:
            new_earliest = cached_data.get("earliest_date", fetch_start)
            new_latest = fetch_end

        save_user_cache(user_email, new_earliest, new_latest, merged_companies, total_cos, total_apps)

        return jsonify({
            "companies": merged_companies,
            "total_companies": total_cos,
            "total_applications": total_apps,
            "from_cache": False,
            "incremental_update": True,
            "cached_range": {"earliest": new_earliest, "latest": new_latest}
        })
    else:
        # Fresh cache
        save_user_cache(
            user_email,
            start_date or fetch_start,
            end_date or fetch_end,
            new_companies,
            result.get("total_companies", 0),
            result.get("total_applications", 0)
        )

        return jsonify({
            "companies": new_companies,
            "total_companies": result.get("total_companies", 0),
            "total_applications": result.get("total_applications", 0),
            "from_cache": False,
            "cached_range": {"earliest": start_date, "latest": end_date}
        })


# =========================
# MANUAL APPLICATION CRUD ENDPOINTS
# =========================
@app.route('/applications/add', methods=['POST'])
def add_application():
    """
    Add a new company/position manually.

    Request body:
    {
        "company": "Company Name",
        "position": {
            "position": "Job Title",
            "application_submitted": "2025-01-01",
            "aptitude_test": null,
            "simulation_test": null,
            "coding_test": null,
            "video_interview": null,
            "num_human_interview": "0",
            "app_accepted": null
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        company_name = data.get("company", "").strip()
        position_data = data.get("position", {})

        if not company_name:
            return jsonify({"error": "Company name is required"}), 400

        user_email = get_user_email()
        if user_email == "unknown":
            return jsonify({"error": "Not authenticated"}), 401

        cache = load_cache()
        user_cache = cache.get(user_email, {})
        companies = user_cache.get("companies", [])

        # Mark position as manually added
        position_data["manual"] = True

        # Check if company exists
        company_found = False
        for company in companies:
            if company["name"].lower() == company_name.lower():
                company["positions"].append(position_data)
                company_found = True
                break

        if not company_found:
            # Add new company marked as manual
            companies.append({
                "name": company_name,
                "positions": [position_data],
                "email_count": 0,
                "manual": True
            })

        # Update totals
        total_companies = len(companies)
        total_applications = sum(len(c["positions"]) for c in companies)

        # Save cache
        user_cache["companies"] = companies
        user_cache["total_companies"] = total_companies
        user_cache["total_applications"] = total_applications
        user_cache["timestamp"] = time.time()
        cache[user_email] = user_cache
        save_cache(cache)

        return jsonify({
            "success": True,
            "companies": companies,
            "total_companies": total_companies,
            "total_applications": total_applications
        })

    except Exception as e:
        print(f"Add application error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/applications/update', methods=['PUT'])
def update_application():
    """
    Update an existing company/position.

    Request body:
    {
        "company": "Company Name",
        "position_index": 0,  // Index of position in company's positions array
        "position": {
            "position": "Updated Job Title",
            "application_submitted": "2025-01-01",
            ...
        }
    }

    Or to update company name:
    {
        "company": "Old Company Name",
        "new_company_name": "New Company Name"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        company_name = data.get("company", "").strip()
        position_index = data.get("position_index")
        position_data = data.get("position")
        new_company_name = data.get("new_company_name", "").strip()

        if not company_name:
            return jsonify({"error": "Company name is required"}), 400

        user_email = get_user_email()
        if user_email == "unknown":
            return jsonify({"error": "Not authenticated"}), 401

        cache = load_cache()
        user_cache = cache.get(user_email, {})
        companies = user_cache.get("companies", [])

        # Find company
        company_idx = None
        for idx, company in enumerate(companies):
            if company["name"].lower() == company_name.lower():
                company_idx = idx
                break

        if company_idx is None:
            return jsonify({"error": f"Company '{company_name}' not found"}), 404

        # Update company name if requested
        if new_company_name:
            companies[company_idx]["name"] = new_company_name

        # Update position if provided
        if position_data is not None and position_index is not None:
            if position_index < 0 or position_index >= len(companies[company_idx]["positions"]):
                return jsonify({"error": "Invalid position index"}), 400

            # Preserve manual flag if it was set, or mark as edited
            was_manual = companies[company_idx]["positions"][position_index].get("manual", False)
            position_data["manual"] = True  # Mark as manually edited
            companies[company_idx]["positions"][position_index] = position_data

        # Update totals
        total_companies = len(companies)
        total_applications = sum(len(c["positions"]) for c in companies)

        # Save cache
        user_cache["companies"] = companies
        user_cache["total_companies"] = total_companies
        user_cache["total_applications"] = total_applications
        user_cache["timestamp"] = time.time()
        cache[user_email] = user_cache
        save_cache(cache)

        return jsonify({
            "success": True,
            "companies": companies,
            "total_companies": total_companies,
            "total_applications": total_applications
        })

    except Exception as e:
        print(f"Update application error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/applications/delete', methods=['DELETE'])
def delete_application():
    """
    Delete a company or specific position.

    Request body:
    {
        "company": "Company Name",
        "position_index": 0  // Optional - if not provided, deletes entire company
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        company_name = data.get("company", "").strip()
        position_index = data.get("position_index")

        if not company_name:
            return jsonify({"error": "Company name is required"}), 400

        user_email = get_user_email()
        if user_email == "unknown":
            return jsonify({"error": "Not authenticated"}), 401

        cache = load_cache()
        user_cache = cache.get(user_email, {})
        companies = user_cache.get("companies", [])

        # Find company
        company_idx = None
        for idx, company in enumerate(companies):
            if company["name"].lower() == company_name.lower():
                company_idx = idx
                break

        if company_idx is None:
            return jsonify({"error": f"Company '{company_name}' not found"}), 404

        if position_index is not None:
            # Delete specific position
            if position_index < 0 or position_index >= len(companies[company_idx]["positions"]):
                return jsonify({"error": "Invalid position index"}), 400

            companies[company_idx]["positions"].pop(position_index)

            # If no positions left, remove the company
            if len(companies[company_idx]["positions"]) == 0:
                companies.pop(company_idx)
        else:
            # Delete entire company
            companies.pop(company_idx)

        # Update totals
        total_companies = len(companies)
        total_applications = sum(len(c["positions"]) for c in companies)

        # Save cache
        user_cache["companies"] = companies
        user_cache["total_companies"] = total_companies
        user_cache["total_applications"] = total_applications
        user_cache["timestamp"] = time.time()
        cache[user_email] = user_cache
        save_cache(cache)

        return jsonify({
            "success": True,
            "companies": companies,
            "total_companies": total_companies,
            "total_applications": total_applications
        })

    except Exception as e:
        print(f"Delete application error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/applications', methods=['GET'])
def get_applications():
    """Get all applications for the current user from cache."""
    try:
        user_email = get_user_email()
        if user_email == "unknown":
            return jsonify({"error": "Not authenticated"}), 401

        user_cache = get_user_cache(user_email)
        if not user_cache:
            return jsonify({
                "companies": [],
                "total_companies": 0,
                "total_applications": 0
            })

        return jsonify({
            "companies": user_cache.get("companies", []),
            "total_companies": user_cache.get("total_companies", 0),
            "total_applications": user_cache.get("total_applications", 0),
            "cached_range": {
                "earliest": user_cache.get("earliest_date"),
                "latest": user_cache.get("latest_date")
            }
        })

    except Exception as e:
        print(f"Get applications error: {e}")
        return jsonify({"error": str(e)}), 500


# =========================
# CHATBOT ENDPOINT
# =========================
@app.route('/chat', methods=['POST'])
def chat():
    """
    AI-powered chatbot that provides personalized insights based on user's applications.

    Request body:
    {
        "message": "User's question",
        "applications": [...] // Array of application objects from frontend
    }

    Response:
    {
        "response": "AI response text"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        user_message = data.get("message", "").strip()
        applications = data.get("applications", [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Build application context for the AI
        app_summary = build_application_context(applications)

        # System prompt with application context
        system_prompt = f"""You are JobTracker AI Assistant, a helpful career coach that provides personalized advice based on the user's job application data.

CURRENT APPLICATION DATA:
{app_summary}

GUIDELINES:
1. Provide specific, actionable advice based on the actual application data above
2. Reference specific companies and positions when relevant
3. Be encouraging but realistic
4. For interview tips, consider the specific companies and their known interview styles
5. When discussing timelines, use the actual dates from the applications
6. If asked about something not in the data, be honest that you don't have that information
7. Keep responses concise but helpful (2-4 paragraphs max)
8. Use a friendly, professional tone

If the user asks about their application status, response rates, or progress, analyze the actual data provided above."""

        # Call GPT-4o-mini
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=500
        )

        ai_response = response.choices[0].message.content or "I'm sorry, I couldn't generate a response. Please try again."

        return jsonify({"response": ai_response})

    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def build_application_context(applications):
    """Build a concise summary of user's applications for the AI context."""
    if not applications:
        return "No applications data available yet. The user hasn't processed their emails."

    total = len(applications)

    # Count by status
    status_counts = {}
    for app in applications:
        status = app.get("status", "Unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    # Group by company
    companies = {}
    for app in applications:
        company = app.get("company", "Unknown")
        if company not in companies:
            companies[company] = []
        companies[company].append(app)

    # Build summary
    lines = [
        f"OVERVIEW: {total} total applications across {len(companies)} companies",
        f"STATUS BREAKDOWN: {', '.join([f'{status}: {count}' for status, count in status_counts.items()])}",
        "",
        "APPLICATIONS BY COMPANY:"
    ]

    for company, apps in companies.items():
        for app in apps:
            position = app.get("position", "Unknown Position")
            status = app.get("status", "Unknown")
            applied_date = app.get("appliedDate", "Unknown date")
            stage = app.get("stage", "Unknown stage")
            interviews = app.get("interviews", 0)

            # Build test info
            tests = app.get("tests", {})
            test_info = []
            if tests.get("aptitude"):
                test_info.append(f"Aptitude: {tests['aptitude']}")
            if tests.get("coding"):
                test_info.append(f"Coding: {tests['coding']}")
            if tests.get("video"):
                test_info.append(f"Video: {tests['video']}")
            if tests.get("simulation"):
                test_info.append(f"Simulation: {tests['simulation']}")

            test_str = f" | Tests: {', '.join(test_info)}" if test_info else ""
            interview_str = f" | Interviews: {interviews}" if interviews > 0 else ""

            lines.append(f"  - {company} | {position} | Applied: {applied_date} | Status: {status} | Stage: {stage}{interview_str}{test_str}")

    # Calculate some metrics
    offers = status_counts.get("Offer", 0)
    rejections = status_counts.get("Rejection", 0)
    interviews_total = sum(app.get("interviews", 0) for app in applications)
    in_progress = total - offers - rejections

    lines.extend([
        "",
        "KEY METRICS:",
        f"  - Response rate: {round(((interviews_total + offers + rejections) / total) * 100) if total > 0 else 0}%",
        f"  - Total interviews received: {interviews_total}",
        f"  - Offers: {offers}, Rejections: {rejections}, In Progress: {in_progress}"
    ])

    return "\n".join(lines)


if __name__ == '__main__':
    print("=" * 60)
    print("  Local Processing Server for JobTracker AI")
    print("  Using EXACT logic from firstfilter.py + secondfilter.py")
    print("=" * 60)
    print("Make sure you're authenticated on Render first!")
    print("")
    print("Starting on http://localhost:5001")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5001, debug=True)
