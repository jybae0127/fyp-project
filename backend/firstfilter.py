# =========================
# firstfilter_improved.py — Fixed version with better email separation
# =========================
import os
import re
import json
import time
import requests
from datetime import datetime, timezone
from openai import AzureOpenAI

# =========================
# 0) Azure OpenAI CONFIG
# =========================
client = AzureOpenAI(
    azure_endpoint="https://api-iw.azure-api.net/sig-shared-jpeast/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
    api_key="72fc700a6bd24963b8e4cf5d28d4e95c",
    api_version="2025-01-01-preview"
)
MODEL = "gpt-5-mini"

# =========================
# 1) CONFIGURATION
# =========================
BASE_URL = "https://gmail-login-backend.onrender.com/query"
OUTPUT_DIR = "applied_companies"  # New output folder for comparison

# Generic tokens to EXCLUDE from search queries (too broad)
GENERIC_TOKENS = {
    "group", "teams", "page", "career", "careers", "jobs", "job",
    "recruit", "recruiting", "recruitment", "talent", "hr", "hiring",
    "global", "international", "asia", "apac", "hk", "hong", "kong",
    "limited", "ltd", "inc", "corp", "corporation", "company",
    "graduate", "analyst", "engineer", "program", "programme"
}

# Known ATS domains (for reference, not blocking)
ATS_DOMAINS = {
    "workday.com", "myworkday.com", "greenhouse.io", "greenhouse-mail.io",
    "lever.co", "hire.lever.co", "tal.net", "brassring.com",
    "hackerrankforwork.com", "hirevue.com", "hirevue-app.eu"
}

# =========================
# 2) Fetch Gmail with Pagination
# =========================
def fetch_all_emails(query, max_loops=50, format_type="full"):
    """Fetch ALL Gmail emails by following next_page_token.

    Args:
        query: Gmail search query
        max_loops: Maximum pagination loops
        format_type: "full" for complete email with body, "metadata" for headers only
    """
    all_msgs = []
    next_page = None

    for _ in range(max_loops):
        params = {"q": query, "format": format_type}
        if next_page:
            params["page_token"] = next_page

        resp = requests.get(BASE_URL, params=params, timeout=60)
        resp.raise_for_status()
        d = resp.json()

        msgs = d.get("messages", [])
        all_msgs.extend(msgs)

        next_page = d.get("next_page_token")
        if not next_page:
            break

    return {"messages": all_msgs}


# =========================
# 3) Utility Functions
# =========================
def clean_domain(email):
    """Extract domain from email address."""
    if not email:
        return ""
    s = email.strip()
    if "<" in s and ">" in s:
        s = s.split("<", 1)[1].split(">", 1)[0]
    if "@" in s:
        s = s.split("@", 1)[1]
    return s.lower().strip(">").strip('"').strip("'")


def extract_first_json(text):
    """Extract JSON from GPT response."""
    m = re.search(r"```json\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    if m:
        return m.group(1).strip()

    start = text.find("{")
    while start != -1:
        depth = 0
        i = start
        in_str = False
        esc = False
        while i < len(text):
            ch = text[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == '"':
                    in_str = False
            else:
                if ch == '"':
                    in_str = True
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        cand = text[start:i+1]
                        try:
                            json.loads(cand)
                            return cand
                        except:
                            break
            i += 1
        start = text.find("{", start + 1)
    return "{}"


def safe_dirname(name):
    """Create safe directory name from company name."""
    base = name.strip().lower().replace(" ", "_")
    return re.sub(r"[^a-z0-9._-]", "", base) or "unknown"


# =========================
# 4) IMPROVED Query Builder
# =========================
def build_strict_query(company, all_messages):
    """
    Build a STRICT Gmail query for a company.
    Key improvements:
    1. Only use meaningful tokens (filter out generic ones)
    2. Prioritize exact company name matches
    3. Use domain matching only for company-specific domains
    4. Avoid body content matching (causes false positives)
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
        # Require at least 2 tokens to match
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
            # Only include if domain contains meaningful company token
            # AND is not a generic ATS domain
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
    # More strict: require company name in subject, not just tokens
    query_parts.append(f'(from:hackerrankforwork.com subject:"{company}")')
    query_parts.append(f'(from:codility.com subject:"{company}")')

    # Combine with OR
    combined = " OR ".join(query_parts)

    # Add date filter and inbox
    final_query = f"({combined}) in:inbox after:2025/08/01"

    return final_query


# =========================
# 5) Post-fetch Validation
# =========================
def validate_emails_for_company(company, emails):
    """
    Filter emails to only include those that actually belong to this company.
    Now uses email body for better validation.
    Returns filtered list of emails.
    """
    company_lower = company.lower()
    tokens = re.split(r"[\s,\-_/&.]+", company_lower)
    meaningful_tokens = [t for t in tokens if t and t not in GENERIC_TOKENS and len(t) > 2]

    validated = []

    for email in emails:
        subject = email.get("subject", "").lower()
        from_email = email.get("from_email", "").lower()
        body = email.get("body", "").lower()[:1000]  # First 1000 chars of body

        # Check if company name or meaningful tokens appear in subject
        subject_match = company_lower in subject or any(t in subject for t in meaningful_tokens if len(t) >= 4)

        # Check if sender domain matches company
        domain = clean_domain(from_email)
        domain_match = any(t in domain for t in meaningful_tokens if len(t) >= 3)

        # Check if company name appears in body (for ATS emails)
        body_match = company_lower in body or any(t in body for t in meaningful_tokens if len(t) >= 4)

        # Special case: ATS emails - must have company name in subject OR body
        is_ats = any(ats in domain for ats in ["workday", "greenhouse", "lever", "brassring", "hirevue", "hackerrank", "tal.net"])
        if is_ats:
            # For ATS emails, require company name in subject or body
            if subject_match or body_match:
                validated.append(email)
        elif subject_match or domain_match:
            validated.append(email)

    return validated


# =========================
# 6) Main Execution
# =========================
def main():
    print("=" * 60)
    print("  FIRSTFILTER IMPROVED - Better Email Separation")
    print("=" * 60)

    # Step 1: Fetch all job-related emails (same query as original)
    query = 'subject:("application" OR "applying" OR "apply" OR "applied") in:inbox after:2025/08/01'

    print("\n📡 Fetching Gmail query results...")
    t0 = time.perf_counter()
    user_json = fetch_all_emails(query)
    t1 = time.perf_counter()
    print(f"⏱️ Gmail data retrieval: {t1 - t0:.2f} seconds")

    msgs = user_json.get("messages", [])
    print(f"📧 Total emails fetched: {len(msgs)}")

    # Save raw emails
    with open("emails_raw.json", "w", encoding="utf-8") as f:
        json.dump(user_json, f, indent=4, ensure_ascii=False)

    # Step 2: Deduplicate and prepare for GPT
    seen, slim = set(), []
    for m in msgs:
        fe = (m.get("from_email") or "").strip()
        sj = (m.get("subject") or "").strip()
        key = (fe.lower(), sj.lower())
        if fe and sj and key not in seen:
            seen.add(key)
            slim.append({"from_email": fe, "subject": sj})

    print(f"📧 Unique emails: {len(slim)}")

    # Step 3: Build prompt for GPT
    lines = []
    for m in slim:
        dom = clean_domain(m["from_email"])
        subj = m["subject"][:160]
        lines.append(f"{dom} | {subj}")

    prompt = f"""Below are job-related emails as 'from_domain | subject'.
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

    # Step 4: Call GPT to extract companies
    print("\n🤖 Calling GPT to extract companies...")
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You extract company names from job application emails."},
            {"role": "user", "content": prompt}
        ]
    )

    raw_output = response.choices[0].message.content or ""
    only_json = extract_first_json(raw_output)

    try:
        companies_raw = json.loads(only_json).get("companies_applied", [])
    except:
        companies_raw = []

    print(f"\n🔍 First extraction: {companies_raw}")

    # Step 5: Clean company names with second GPT call
    clean_prompt = f"""Clean this list of company names:

1. REMOVE non-companies: "BAE", "KIM", "WORKDAY", "GREENHOUSE", "LEVER", generic names
2. NORMALIZE: "Morgan Stanley HK" → "Morgan Stanley", "Bloomberg L.P." → "Bloomberg"
3. MERGE duplicates
4. IMPORTANT: Keep "UBS" and "ION Group" as SEPARATE companies (they are different!)

Input: {companies_raw}
Output JSON: {{"clean_companies": ["Company1", "Company2", ...]}}"""

    print("\n🤖 Cleaning company names...")
    resp2 = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You clean and deduplicate company names."},
            {"role": "user", "content": clean_prompt}
        ]
    )

    clean_json = extract_first_json(resp2.choices[0].message.content or "")
    try:
        companies = json.loads(clean_json).get("clean_companies", [])
    except:
        companies = companies_raw

    print(f"\n🎯 Final companies: {companies}")

    # Step 6: Create folders and fetch emails per company
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\n📬 Fetching emails per company (output: {OUTPUT_DIR})...\n")

    for company in companies:
        folder = os.path.join(OUTPUT_DIR, safe_dirname(company))
        os.makedirs(folder, exist_ok=True)

        # Build strict query
        query = build_strict_query(company, msgs)
        print(f"🔎 {company}")
        print(f"   Query: {query[:100]}...")

        try:
            data = fetch_all_emails(query)
            raw_emails = data.get("messages", [])
            print(f"   Raw fetched: {len(raw_emails)}")

            # Validate emails belong to this company
            validated_emails = validate_emails_for_company(company, raw_emails)
            print(f"   After validation: {len(validated_emails)}")

            # Save validated emails
            output = {"messages": validated_emails}
            with open(os.path.join(folder, "emails.json"), "w", encoding="utf-8") as f:
                json.dump(output, f, indent=4, ensure_ascii=False)

            print(f"   ✅ Saved to {folder}/emails.json\n")

        except Exception as e:
            print(f"   ⚠️ Failed: {e}\n")

    print("=" * 60)
    print("  🎉 DONE!")
    print("=" * 60)


if __name__ == "__main__":
    main()
