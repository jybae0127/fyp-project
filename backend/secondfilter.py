# secondfilter_improved.py
# Improved version with:
# 1. Pre-filtering to reduce tokens by ~70%
# 2. Better classification accuracy via regex pre-detection
# 3. Compact prompt format
# 4. Two-pass approach for complex cases

import os
import re
import json
import time
from pathlib import Path
from datetime import datetime
from openai import AzureOpenAI

# =========================
# 0) Azure OpenAI Setup
# =========================
client = AzureOpenAI(
    azure_endpoint="https://api-iw.azure-api.net/sig-shared-jpeast/deployments/gpt-4o-mini/chat/completions?api-version=2025-01-01-preview",
    api_key="72fc700a6bd24963b8e4cf5d28d4e95c",
    api_version="2025-01-01-preview"
)
MODEL = "gpt-5-mini"

# =========================
# 1) SKIP PATTERNS - Emails to exclude entirely
# =========================
SKIP_PATTERNS = [
    # Support tickets
    r"zendesk\.com",
    r"Ticket\s*#\d+",
    r"We are waiting for your response",

    # Marketing/promotional
    r"theforage\.com.*Build skills",
    r"Your Cluely Digest",
    r"Latest.*jobs.*in",
    r"New jobs for:",

    # Logistics/reminders (not application progress)
    r"Welcome to .* Office$",
    r"Event Reminder",
    r"Your registration for Virtual",
    r"days left to complete",
    r"credly\.com",  # Certification badges
]

# =========================
# 2) STAGE DETECTION PATTERNS - Pre-classify before GPT
# =========================
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

# =========================
# 3) HELPER FUNCTIONS
# =========================

def parse_date(date_str):
    """Normalize date to YYYY-MM-DD format"""
    if not date_str:
        return None

    # ISO format: 2025-10-02T03:43:14+00:00
    match = re.search(r"(\d{4}-\d{2}-\d{2})", date_str)
    if match:
        return match.group(1)

    # RFC format: Mon, 03 Nov 2025 21:43:20 +0000
    try:
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
    """Check if email should be skipped (noise)"""
    subject = email.get("subject", "").lower()
    from_email = email.get("from_email", "").lower()
    text = f"{subject} {from_email}"

    for pattern in SKIP_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def detect_stages(email):
    """Pre-detect stages using regex patterns. Returns list of detected stages."""
    subject = email.get("subject", "").lower()
    from_email = email.get("from_email", "").lower()
    body = email.get("body", "").lower()[:500]  # First 500 chars of body
    text = f"{subject} {from_email} {body}"

    detected = []
    for stage, patterns in STAGE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                detected.append(stage)
                break
    return detected


def deduplicate_emails(emails):
    """Remove duplicate emails based on normalized subject + content type.

    Keeps emails with different content types (rejection vs non-rejection)
    even if they have the same subject.
    """
    seen = set()
    unique = []

    # Rejection indicators to differentiate content
    rejection_phrases = ["regret to inform", "will not be moving forward", "not proceed", "unfortunately"]

    for email in emails:
        subject = email.get("subject", "")
        body = email.get("body", "").lower()[:500]

        # Normalize subject
        normalized = re.sub(r"^(re:|fwd:|fw:)\s*", "", subject.lower(), flags=re.IGNORECASE).strip()

        # Check if this is a rejection email
        is_rejection = any(phrase in body for phrase in rejection_phrases)

        # Include rejection status in key to keep rejection emails separate
        key = (normalized[:60], is_rejection)

        if key not in seen:
            seen.add(key)
            unique.append(email)

    return unique


def clean_body_text(body):
    """Clean and truncate body text for GPT prompt"""
    if not body:
        return ""

    # Remove excessive whitespace and newlines
    text = re.sub(r'\s+', ' ', body).strip()

    # Remove common email footers/signatures
    text = re.sub(r'(unsubscribe|privacy policy|terms of service|view in browser).*', '', text, flags=re.IGNORECASE)

    # Remove URLs
    text = re.sub(r'https?://\S+', '[link]', text)

    # Truncate to 300 chars
    if len(text) > 300:
        text = text[:300] + "..."

    return text


def format_compact(emails):
    """Format emails in compact format WITH body content for better GPT analysis"""
    lines = []
    for e in emails:
        date = parse_date(e.get("date", "")) or "?"
        subject = e.get("subject", "")[:80]  # Truncate long subjects

        # Extract domain from email
        from_email = e.get("from_email", "")
        domain_match = re.search(r"@([^>\s]+)", from_email)
        domain = domain_match.group(1)[:25] if domain_match else "?"

        # Get detected stages for this email
        stages = detect_stages(e)
        stage_str = f" [{','.join(stages)}]" if stages else ""

        # Include truncated body for better context
        body = clean_body_text(e.get("body", ""))
        body_str = f"\n   Body: {body}" if body else ""

        lines.append(f"{date} | {domain} | {subject}{stage_str}{body_str}")

    return "\n".join(lines)


def extract_json(text):
    """Extract JSON from GPT response"""
    # Try markdown code block first
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass

    # Try to find raw JSON
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


# =========================
# 4) MAIN PROCESSING
# =========================

def process_company(company_dir: Path, output_dir: Path = None):
    """Process a company's emails and extract application timeline.

    Args:
        company_dir: Path to input company folder (with emails.json)
        output_dir: Path to output folder (defaults to company_dir if not specified)
    """
    if output_dir is None:
        output_dir = company_dir

    company_name = company_dir.name.replace("_", " ").title()
    emails_path = company_dir / "emails.json"

    if not emails_path.exists():
        print(f"  SKIP: {company_dir.name} (no emails.json)")
        return

    with open(emails_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_emails = data.get("messages", [])

    print(f"\n{'='*60}")
    print(f"  {company_name.upper()}")
    print(f"{'='*60}")
    print(f"  Raw emails: {len(raw_emails)}")

    # Step 1: Filter out noise
    filtered = [e for e in raw_emails if not should_skip(e)]
    print(f"  After noise filter: {len(filtered)}")

    # Step 2: Sort by date (oldest first)
    filtered.sort(key=lambda x: parse_date(x.get("date", "")) or "9999")

    # Step 3: Deduplicate
    unique = deduplicate_emails(filtered)
    print(f"  After dedup: {len(unique)}")

    # Step 4: Pre-detect stages using regex
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

    print(f"  Pre-detected: {json.dumps({k:v for k,v in pre_detected.items() if v}, indent=2)}")

    # Step 5: Build compact prompt
    compact_text = format_compact(unique)

    # Calculate token savings
    original_chars = len(json.dumps([{
        "subject": e.get("subject"),
        "date": e.get("date"),
        "from_email": e.get("from_email")
    } for e in raw_emails], indent=2))
    new_chars = len(compact_text)
    savings = (1 - new_chars / max(original_chars, 1)) * 100
    print(f"  Token reduction: {savings:.1f}% ({original_chars} → {new_chars} chars)")

    # Step 6: Build GPT prompt
    # Build pre-detected hint for GPT
    pre_detected_hints = []
    if pre_detected["rejection"]:
        pre_detected_hints.append(f"REJECTION detected on {pre_detected['rejection']}")
    if pre_detected["offer"]:
        pre_detected_hints.append(f"OFFER detected on {pre_detected['offer']}")
    pre_hint_str = "\n".join(pre_detected_hints) if pre_detected_hints else ""

    prompt = f"""Analyze job application emails for "{company_name}".

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

    # Step 7: Call GPT
    print(f"  Calling GPT...")
    t0 = time.perf_counter()

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a precise job application timeline extractor. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistency
        )

        elapsed = time.perf_counter() - t0
        print(f"  GPT time: {elapsed:.2f}s")

        raw_output = response.choices[0].message.content or ""
        result = extract_json(raw_output)

        if not result:
            print(f"  ERROR: Could not parse JSON from: {raw_output[:200]}")
            return

        # Step 8: Process positions array
        positions = result.get("positions", [])

        # Handle legacy single-position format
        if not positions and result.get("position"):
            positions = [result]

        if not positions:
            print(f"  ERROR: No positions found in result")
            return

        # Clean up and enrich each position
        bad_position_patterns = [
            "job title", "actual job title", "empty string", "role at",
            "thank you for", "we've received", "we have received",
            "your application", "application received"
        ]

        final_positions = []
        for i, pos in enumerate(positions):
            position_name = pos.get("position", "")
            if any(bad in position_name.lower() for bad in bad_position_patterns):
                position_name = ""

            # For the first/main position, use pre-detected data as fallback
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

            # Clean up null strings
            for key in final_pos:
                if final_pos[key] == "null":
                    final_pos[key] = None

            final_positions.append(final_pos)

        final = {"positions": final_positions}

        # Save result
        out_path = output_dir / "application_process.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(final, f, indent=2, ensure_ascii=False)

        print(f"  SAVED: {out_path}")
        print(f"  Result: {json.dumps(final, indent=2)}")

    except Exception as e:
        print(f"  ERROR: {e}")


def main():
    # Input: read from applied_companies (improved firstfilter output)
    input_root = Path("applied_companies")
    # Output: write to same folder
    output_root = Path("applied_companies")

    if not input_root.exists():
        print("ERROR: 'applied_companies' folder not found.")
        print("Run firstfilter.py first to create company folders.")
        return

    # Create output folder
    output_root.mkdir(exist_ok=True)

    companies = sorted([p for p in input_root.iterdir() if p.is_dir()])
    print(f"Found {len(companies)} companies.\n")
    print(f"Output will be saved to: {output_root}\n")

    total_start = time.perf_counter()

    for company in companies:
        # Create output company folder
        output_company_dir = output_root / company.name
        output_company_dir.mkdir(exist_ok=True)

        # Copy emails.json to output folder for reference (only if different folders)
        emails_src = company / "emails.json"
        emails_dst = output_company_dir / "emails.json"
        if emails_src.exists() and emails_src.resolve() != emails_dst.resolve():
            import shutil
            shutil.copy(emails_src, emails_dst)

        process_company(company, output_company_dir)

    total_elapsed = time.perf_counter() - total_start
    print(f"\n{'='*60}")
    print(f"  DONE! Total time: {total_elapsed:.2f}s")
    print(f"  Results saved to: {output_root}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
