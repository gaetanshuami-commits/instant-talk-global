"""
Instant Talk — Growth Automation Engine
Orchestrates Apollo B2B/B2G lead extraction → Instantly outreach campaigns.
Usage: python agents/growth.py [--segment b2b|b2g|b2c] [--limit 50]
"""

import os
import sys
import json
import time
import argparse
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv("agents/.env")
load_dotenv(".env.local", override=False)
load_dotenv(".env.vercel.local", override=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("growth")

APOLLO_KEY   = os.getenv("APOLLO_API_KEY", "")
INSTANTLY_KEY = os.getenv("INSTANTLY_API_KEY", "")

# ── Target personas per segment ────────────────────────────────────────────────

SEGMENTS = {
    "b2b": {
        "keywords": ["import export", "international trade", "global business", "multinational", "cross-border commerce"],
        "titles": ["CEO", "COO", "Head of International", "VP Global Operations", "Director of Business Development"],
        "industries": ["International Trade & Development", "Import and Export", "Logistics and Supply Chain", "Business Consulting"],
        "subject": "Break language barriers in your international meetings — Instant Talk",
        "body": (
            "Hi {first_name},\n\n"
            "Running international meetings across {country} and multiple time zones?\n\n"
            "Instant Talk provides real-time voice translation for 26 languages — your team speaks their language, "
            "everyone else hears them in theirs. Sub-400ms latency, no interpreters needed.\n\n"
            "We work with B2B teams in logistics, trade, and global operations.\n\n"
            "Worth a 15-minute demo? → https://instant-talk.com/pricing\n\n"
            "Best,\nThe Instant Talk Team"
        ),
    },
    "b2g": {
        "keywords": ["government", "public sector", "ministry", "embassy", "international organization", "NGO"],
        "titles": ["Secretary General", "Director", "Minister", "Ambassador", "Head of International Cooperation"],
        "industries": ["Government Administration", "International Affairs", "Nonprofit Organization Management"],
        "subject": "Multilingual meetings for institutions — Instant Talk",
        "body": (
            "Dear {first_name},\n\n"
            "Instant Talk enables government bodies and international organizations to hold multilingual meetings "
            "without interpreters — 26 languages, real-time voice translation, GDPR-compliant infrastructure.\n\n"
            "Deployed for diplomatic summits, inter-ministry coordination, and multilateral negotiations.\n\n"
            "We offer an Enterprise plan with dedicated SLA and custom deployment.\n\n"
            "Available for a brief call? → https://instant-talk.com/contact\n\n"
            "Regards,\nInstant Talk Enterprise Team"
        ),
    },
    "b2c": {
        "keywords": ["language learning", "remote work", "digital nomad", "freelancer international", "online tutor"],
        "titles": ["Freelancer", "Consultant", "Language Teacher", "Online Coach", "Remote Worker"],
        "industries": ["E-Learning", "Professional Training & Coaching", "Staffing and Recruiting"],
        "subject": "Speak every language in your meetings — Instant Talk",
        "body": (
            "Hi {first_name},\n\n"
            "Working internationally? Instant Talk translates your voice in real-time across 26 languages — "
            "so your clients always hear you in their language.\n\n"
            "3-day free trial, no credit card. → https://instant-talk.com/pricing\n\n"
            "Cheers,\nThe Instant Talk Team"
        ),
    },
}

# ── Apollo lead extraction ─────────────────────────────────────────────────────

def search_apollo(segment: str, limit: int = 50) -> list[dict]:
    """Search Apollo.io for contacts matching segment profile."""
    import requests

    if not APOLLO_KEY:
        log.error("APOLLO_API_KEY not set")
        return []

    cfg = SEGMENTS[segment]
    leads = []

    for keyword in cfg["keywords"]:
        if len(leads) >= limit:
            break

        url = "https://api.apollo.io/v1/mixed_people/search"
        payload = {
            "api_key": APOLLO_KEY,
            "q_organization_keyword_tags": [keyword],
            "person_titles": cfg["titles"],
            "page": 1,
            "per_page": min(25, limit - len(leads)),
        }

        try:
            resp = requests.post(url, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            people = data.get("people", [])
            log.info("Apollo '%s' → %d contacts", keyword, len(people))
            leads.extend(people)
        except Exception as exc:
            log.warning("Apollo search failed for '%s': %s", keyword, exc)

        time.sleep(0.5)  # respect rate limits

    return leads[:limit]

# ── Lead normalisation ─────────────────────────────────────────────────────────

def normalise(person: dict) -> dict | None:
    """Extract relevant fields from Apollo person object."""
    email = person.get("email") or person.get("personal_emails", [None])[0]
    if not email or "@" not in email:
        return None

    org = person.get("organization") or {}
    return {
        "email": email,
        "first_name": person.get("first_name", "there"),
        "last_name": person.get("last_name", ""),
        "title": person.get("title", ""),
        "company": org.get("name", ""),
        "country": org.get("country", ""),
        "website": org.get("website_url", ""),
        "linkedin": person.get("linkedin_url", ""),
    }

# ── Instantly campaign push ────────────────────────────────────────────────────

def push_to_instantly(leads: list[dict], segment: str, campaign_id: str | None = None, dry_run: bool = False) -> int:
    """Push enriched leads to Instantly.ai outreach campaign."""
    import requests

    if not INSTANTLY_KEY:
        log.error("INSTANTLY_API_KEY not set")
        return 0

    if not leads:
        log.info("No leads to push")
        return 0

    cfg = SEGMENTS[segment]
    sent = 0

    for lead in leads:
        subject = cfg["subject"]
        body = cfg["body"].format(
            first_name=lead.get("first_name", "there"),
            company=lead.get("company", "your company"),
            country=lead.get("country", "your region"),
        )

        if dry_run:
            log.info("[DRY-RUN] Would send to %s: %s", lead["email"], subject)
            sent += 1
            continue

        # Add lead to Instantly campaign
        payload: dict = {
            "email": lead["email"],
            "firstName": lead.get("first_name", ""),
            "lastName": lead.get("last_name", ""),
            "companyName": lead.get("company", ""),
            "website": lead.get("website", ""),
            "personalization": body,
            "customVariables": {
                "title": lead.get("title", ""),
                "country": lead.get("country", ""),
                "linkedin": lead.get("linkedin", ""),
            },
        }
        if campaign_id:
            payload["campaign_id"] = campaign_id

        try:
            resp = requests.post(
                "https://api.instantly.ai/api/v1/lead/add",
                headers={"Authorization": f"Bearer {INSTANTLY_KEY}", "Content-Type": "application/json"},
                json=payload,
                timeout=15,
            )
            if resp.status_code in (200, 201):
                sent += 1
                log.info("Lead pushed: %s (%s)", lead["email"], lead.get("company", ""))
            else:
                log.warning("Instantly rejected %s: %s %s", lead["email"], resp.status_code, resp.text[:120])
        except Exception as exc:
            log.warning("Failed to push %s: %s", lead["email"], exc)

        time.sleep(0.3)

    return sent

# ── Report ─────────────────────────────────────────────────────────────────────

def write_report(segment: str, raw_count: int, valid_count: int, pushed: int) -> str:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = f"agents/outreach/report_{segment}_{ts}.json"
    os.makedirs("agents/outreach", exist_ok=True)
    with open(path, "w") as f:
        json.dump({
            "segment": segment,
            "timestamp": ts,
            "apollo_raw": raw_count,
            "valid_leads": valid_count,
            "pushed_to_instantly": pushed,
        }, f, indent=2)
    return path

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Instant Talk Growth Engine")
    parser.add_argument("--segment", choices=["b2b", "b2g", "b2c"], default="b2b")
    parser.add_argument("--limit", type=int, default=50, help="Max leads to extract from Apollo")
    parser.add_argument("--campaign-id", default=None, help="Instantly campaign ID")
    parser.add_argument("--dry-run", action="store_true", help="Print leads without sending")
    args = parser.parse_args()

    log.info("=== Instant Talk Growth Engine | segment=%s limit=%d ===", args.segment, args.limit)

    # 1. Extract
    log.info("Extracting leads from Apollo.io...")
    raw = search_apollo(args.segment, args.limit)
    log.info("Apollo returned %d raw results", len(raw))

    # 2. Normalize
    leads = [n for p in raw if (n := normalise(p))]
    log.info("%d valid leads after normalisation", len(leads))

    if not leads:
        log.warning("No valid leads found. Check Apollo API key and segment config.")
        sys.exit(0)

    # 3. Push to Instantly
    log.info("Pushing to Instantly.ai (dry_run=%s)...", args.dry_run)
    pushed = push_to_instantly(leads, args.segment, args.campaign_id, args.dry_run)
    log.info("Pushed %d / %d leads", pushed, len(leads))

    # 4. Report
    report_path = write_report(args.segment, len(raw), len(leads), pushed)
    log.info("Report saved → %s", report_path)
    log.info("=== Done ===")

if __name__ == "__main__":
    main()
