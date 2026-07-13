import csv
import json
import math
import os
import re
from collections import defaultdict
from urllib.parse import urlparse

# Regular expression for email validation
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Stop words for company casing
STOP_WORDS = {
    "and", "or", "of", "in", "for", "the", "with",
    "i", "z", "w", "o", "u", "na", "do", "dla", "pod", "nad", "przy", "oraz", "lub"
}

# Stage families for CRM status mapping
STAGE_FAMILY_MAP = {
    'new': {
        "new", "inbox", "draft", "raw", "to_contact", 
        "do kontaktu", "inbound (wtyczka)"
    },
    'contacted': {
        "contacted", "sent", "outreach", "pm_sent", "email_sent", "message_sent", 
        "wysłano pm / komentarz", "wysłano pm/komentarz", "wysłana wiadomość"
    },
    'responded': {
        "replied", "responded", "engaged", "in_progress", "chatting", "discussion", 
        "odpowiedział", "odpowiedzial", "rozmowa w toku"
    },
    'negotiation': {
        "negotiation", "offer", "meeting", "demo", 
        "negocjacja", "zakwalifikowane"
    },
    'won': {
        "won", "active", "closed_won", "success", "deal", "client", 
        "zamknięty / aktywny", "zamkniety / aktywny", "zamknięty/aktywny", 
        "zamknięte / sukces", "zamkniete / sukces", "zamknięte/sukces"
    },
    'lost': {
        "lost", "closed_lost", "closed-lost", "refused", "rejection", "rejected",
        "odrzucone", "archiwum", "archived", "trash"
    }
}

FB_STAGES = {
    'new': 'Do kontaktu',
    'contacted': 'Wysłano PM / Komentarz',
    'responded': 'Odpowiedział',
    'negotiation': 'Negocjacja',
    'won': 'Zamknięty / Aktywny',
    'lost': 'Odrzucone'
}

INBOUND_STAGES = {
    'new': 'Inbound (Wtyczka)',
    'contacted': 'Wysłana wiadomość',
    'responded': 'Rozmowa w toku',
    'negotiation': 'Zakwalifikowane',
    'won': 'Zamknięte / Sukces',
    'lost': 'Odrzucone'
}


def resolve_score_column(headers):
    candidates = [
        "qualificationscore", "qualification_score", "score", "lead_score", 
        "priorityscore", "est value (usd)", "estimated_clv_usd", "value"
    ]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def resolve_company_column(headers):
    candidates = ["company", "company/persona", "company_name"]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def resolve_email_column(headers):
    candidates = ["email", "email_address", "mail"]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def resolve_url_column(headers):
    candidates = ["url", "website", "domain", "company_website", "link"]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def resolve_status_column(headers):
    candidates = ["status", "stage", "lead_status", "state", "status_id"]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def resolve_source_column(headers):
    candidates = ["source", "utm_source", "lead_source", "channel"]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def resolve_value_column(headers):
    candidates = ["est value (usd)", "value", "estimated_clv_usd", "estimatedvaluehex"]
    for cand in candidates:
        for col in headers:
            if col.strip().lower() == cand:
                return col
    return None


def parse_score(val_str):
    """
    Parses and scales the qualification score.
    Returns (score_val, is_missing_flag).
    """
    val_str = val_str.strip()
    if not val_str:
        return 75, True
    
    val_lower = val_str.lower()
    if val_lower in ("high", "gorący", "goracy"):
        return 90, False
    elif val_lower in ("medium", "ciepły", "cieply"):
        return 65, False
    elif val_lower in ("low", "zimny"):
        return 30, False
    
    try:
        f_val = float(val_str)
        if math.isinf(f_val) or math.isnan(f_val):
            return 75, True
        if 0.0 < f_val <= 1.0:
            score = int(round(f_val * 100))
        else:
            score = int(round(f_val))
        score = max(0, min(100, score))
        return score, False
    except (ValueError, OverflowError):
        return 75, True


def clean_email(email_str):
    """
    Validates email format.
    Returns (cleaned_email, is_error_flag).
    """
    email_str = email_str.strip()
    if not email_str:
        return "", False
    if EMAIL_REGEX.match(email_str):
        return email_str, False
    else:
        return "", True


def clean_url(url_str):
    """
    Cleans and validates URL.
    Returns (cleaned_url, is_error_flag).
    """
    url_str = url_str.strip()
    if not url_str:
        return "", False
    
    url_lower = url_str.lower()
    if not (url_lower.startswith("http://") or url_lower.startswith("https://")):
        url_str = "https://" + url_str
        
    try:
        parsed = urlparse(url_str)
        host = parsed.netloc
        if not host:
            return "", True
            
        hostname = parsed.hostname
        if not hostname:
            hostname = host.split(":")[0]
            
        hostname_lower = hostname.lower()
        if hostname_lower == "localhost" or "." not in hostname_lower:
            return "", True
            
        return url_str, False
    except Exception:
        return "", True


def has_internal_camel_case(word):
    """
    Determines if a word contains internal camelCasing.
    """
    # Strip symbols/numbers for the check
    clean_word = re.sub(r'[^\w]', '', word)
    has_upper = any(c.isupper() for c in clean_word)
    has_lower = any(c.islower() for c in clean_word)
    if not (has_upper and has_lower):
        return False
    # Uppercase char must exist at index >= 1
    for c in clean_word[1:]:
        if c.isupper():
            return True
    return False


def standardize_suffixes(name):
    """
    Replaces legal suffixes with standardized versions.
    """
    # sp. z o.o. / sp z oo -> Sp. z o.o.
    name = re.sub(r'\bsp\.?\s*z\.?\s*o\.?\s*o\.?(?!\w)', 'Sp. z o.o.', name, flags=re.IGNORECASE)
    
    # s.a. / sa -> S.A.
    name = re.sub(r'\bs\.?\s*a\.?(?!\w)', 'S.A.', name, flags=re.IGNORECASE)
    
    # gmbh -> GmbH
    name = re.sub(r'\bgmbh\b', 'GmbH', name, flags=re.IGNORECASE)
    
    # llc -> LLC
    name = re.sub(r'\bllc\b', 'LLC', name, flags=re.IGNORECASE)
    
    # ltd -> LTD
    name = re.sub(r'\bltd\b', 'LTD', name, flags=re.IGNORECASE)
    
    # inc -> Inc.
    name = re.sub(r'\binc\.?(?!\w)', 'Inc.', name, flags=re.IGNORECASE)
    
    return " ".join(name.split())


def collapse_duplicate_suffixes(name):
    """
    Collapses consecutive duplicate suffix words at the end of company names.
    """
    suffixes = ["Sp. z o.o.", "S.A.", "GmbH", "LLC", "LTD", "Inc."]
    changed = True
    while changed:
        changed = False
        for suffix in suffixes:
            pattern = r'\b' + re.escape(suffix) + r'(?:\s*,\s*|\s+)' + re.escape(suffix) + r'\s*$'
            match = re.search(pattern, name)
            if match:
                name = name[:match.start()] + suffix
                changed = True
    return name


def case_company_name(name):
    """
    Capitalizes words (title case) except stop words (unless first word),
    preserves camelCase, and standardizes legal suffixes.
    """
    name = " ".join(name.split())
    if not name:
        return ""
        
    words = name.split()
    cased_words = []
    for i, word in enumerate(words):
        # Extract surrounding punctuation (like commas, parentheses, etc.)
        match = re.match(r'^([^\w]*)(.*?)([^\w]*)$', word)
        if match:
            prefix, core, suffix = match.groups()
        else:
            prefix, core, suffix = "", word, ""
            
        if not core:
            cased_words.append(word)
            continue
            
        if has_internal_camel_case(core):
            # Keep lowercase-initiated camelCase brand names completely untouched
            cased_words.append(prefix + core + suffix)
        else:
            core_lower = core.lower()
            if core_lower in STOP_WORDS and i > 0:
                cased_words.append(prefix + core_lower + suffix)
            else:
                cased_words.append(prefix + core.capitalize() + suffix)
                
    cased_name = " ".join(cased_words)
    standardized = standardize_suffixes(cased_name)
    return collapse_duplicate_suffixes(standardized)


def detect_pipeline_type(row, source_col, status_col):
    """
    Detects pipeline type ('fb' or 'inbound') based on source and status columns.
    """
    if source_col and source_col in row:
        src_val = row[source_col].strip().lower()
        if any(x in src_val for x in ["facebook", "fb", "messenger", "instagram", "ig", "meta"]):
            return "fb"
        if any(x in src_val for x in ["inbound", "wtyczka", "plugin", "website", "form"]):
            return "inbound"
            
    if status_col and status_col in row:
        st_val = row[status_col].strip().lower()
        if st_val in ["do kontaktu", "wysłano pm / komentarz", "wysłano pm/komentarz", "odpowiedział", "odpowiedzial", "negocjacja", "zamknięty / aktywny", "zamkniety / aktywny", "zamknięty/aktywny"]:
            return "fb"
        if st_val in ["inbound (wtyczka)", "wysłana wiadomość", "rozmowa w toku", "zakwalifikowane", "zamknięte / sukces", "zamkniete / sukces", "zamknięte/sukces"]:
            return "inbound"
            
    return "inbound"


def is_word_match(term, status_str):
    """
    Finds term with boundaries that are non-word characters (excluding apostrophe).
    """
    pattern = r'(?:^|[^\w\'])' + re.escape(term) + r'(?:$|[^\w\'])'
    return bool(re.search(pattern, status_str))


def normalize_status(status_str, pipeline_type):
    """
    Maps raw status to a normalized CRM pipeline stage.
    """
    status_str = status_str.strip()
    if not status_str:
        return "Do kontaktu" if pipeline_type == "fb" else "Inbound (Wtyczka)"
        
    status_lower = status_str.lower()
    matched_family = None
    
    # Precise match
    for family, terms in STAGE_FAMILY_MAP.items():
        if status_lower == family or status_lower in terms:
            matched_family = family
            break
            
    # Substring/containment fallback
    if not matched_family:
        for family, terms in STAGE_FAMILY_MAP.items():
            for term in terms:
                if is_word_match(term, status_lower):
                    matched_family = family
                    break
            if matched_family:
                break
                
    if not matched_family:
        return "Do kontaktu" if pipeline_type == "fb" else "Inbound (Wtyczka)"
        
    if pipeline_type == "fb":
        return FB_STAGES[matched_family]
    else:
        return INBOUND_STAGES[matched_family]


def parse_float_value(val_str):
    """
    Cleans currency characters and parses string to float.
    Supports European formats, Polish formats, and standard US formats.
    """
    if not val_str:
        return None
    val_str = val_str.strip()
    if not val_str:
        return None
        
    # Remove any characters except digits, commas, dots, spaces, and minus
    cleaned = re.sub(r'[^\d.,\s-]', '', val_str).strip()
    if not cleaned:
        return None
        
    # Remove spaces/non-breaking spaces (used as thousands separator)
    cleaned = cleaned.replace(' ', '').replace('\xa0', '')
    
    last_dot = cleaned.rfind('.')
    last_comma = cleaned.rfind(',')
    
    try:
        if last_dot != -1 and last_comma != -1:
            if last_dot > last_comma:
                # Dot is decimal, comma is thousands
                final = cleaned.replace(',', '')
            else:
                # Comma is decimal, dot is thousands
                final = cleaned.replace('.', '').replace(',', '.')
        elif last_comma != -1:
            # Only comma
            suffix = cleaned[last_comma+1:]
            comma_count = cleaned.count(',')
            if comma_count > 1 or (len(suffix) == 3 and suffix.isdigit()):
                # Thousands separator
                final = cleaned.replace(',', '')
            else:
                # Decimal separator
                final = cleaned.replace(',', '.')
        else:
            # Only dot or no separator
            if cleaned.count('.') > 1:
                # Multiple dots -> thousands
                final = cleaned.replace('.', '')
            else:
                final = cleaned
        return float(final)
    except ValueError:
        return None


def get_stage_family(status_str):
    """
    Gets the stage family ('new', 'contacted', 'responded', 'negotiation', 'won', 'lost')
    for a normalized status string.
    """
    status_lower = status_str.lower()
    for family, terms in STAGE_FAMILY_MAP.items():
        if status_lower == family or status_lower in terms:
            return family
    # Fallback to check if it's one of the stage names directly
    for family, name in FB_STAGES.items():
        if name.lower() == status_lower:
            return family
    for family, name in INBOUND_STAGES.items():
        if name.lower() == status_lower:
            return family
    # Try word match just in case
    for family, terms in STAGE_FAMILY_MAP.items():
        for term in terms:
            if is_word_match(term, status_lower):
                return family
    return 'new'


class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, i):
        path = []
        while self.parent[i] != i:
            path.append(i)
            i = self.parent[i]
        for node in path:
            self.parent[node] = i
        return i

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1
            return True
        return False


def process_csv(input_path, output_path, report_path, target_pipeline=None):
    """
    Main function to ingest, clean, validate, standardize, and analyze CSV leads.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    # Read original file
    with open(input_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, skipinitialspace=True)
        try:
            headers = next(reader)
        except StopIteration:
            # Empty file
            headers = []
            
        rows = list(reader)
        
    # Filter out completely empty rows
    valid_rows = []
    for r in rows:
        # Check if there is at least one non-empty cell after stripping
        if any(cell.strip() for cell in r):
            valid_rows.append([cell.strip() for cell in r])
            
    if not headers:
        # Write empty outputs
        with open(output_path, mode='w', encoding='utf-8', newline='') as f:
            pass
        with open(report_path, mode='w', encoding='utf-8') as f:
            json.dump({
                "average_lead_value": 0,
                "priority_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0},
                "source_efficiency": {},
                "errors_summary": {
                    "duplicates_removed": 0,
                    "invalid_emails_cleaned": 0,
                    "invalid_urls_cleaned": 0,
                    "missing_scores_filled": 0,
                    "casing_standardized": 0
                }
            }, f, indent=4)
        return
        
    # Resolve columns
    score_col = resolve_score_column(headers)
    company_col = resolve_company_column(headers)
    email_col = resolve_email_column(headers)
    url_col = resolve_url_column(headers)
    status_col = resolve_status_column(headers)
    source_col = resolve_source_column(headers)
    value_col = resolve_value_column(headers)
    
    # Get column indices
    score_idx = headers.index(score_col) if score_col else None
    company_idx = headers.index(company_col) if company_col else None
    email_idx = headers.index(email_col) if email_col else None
    url_idx = headers.index(url_col) if url_col else None
    status_idx = headers.index(status_col) if status_col else None
    source_idx = headers.index(source_col) if source_col else None
    value_idx = headers.index(value_col) if value_col else None
    
    # Error count accumulators
    invalid_emails_cleaned = 0
    invalid_urls_cleaned = 0
    missing_scores_filled = 0
    casing_standardized = 0
    
    processed_records = []
    
    for idx, row in enumerate(valid_rows):
        # Create a dict wrapper for column lookup/modification
        row_dict = {headers[i]: (row[i] if i < len(row) else "") for i in range(len(headers))}
        
        # Clean score
        parsed_score_val = 75
        is_missing_score = False
        if score_col:
            raw_score = row_dict[score_col]
            parsed_score_val, is_missing_score = parse_score(raw_score)
            parsed_score_val = max(0, min(100, parsed_score_val))
            row_dict[score_col] = str(parsed_score_val)
        else:
            is_missing_score = True
            
        if is_missing_score:
            missing_scores_filled += 1
            
        # Clean email
        is_invalid_email = False
        if email_col:
            raw_email = row_dict[email_col]
            cleaned_e, is_invalid_email = clean_email(raw_email)
            row_dict[email_col] = cleaned_e
            if is_invalid_email:
                invalid_emails_cleaned += 1
                
        # Clean URL
        is_invalid_url = False
        if url_col:
            raw_url = row_dict[url_col]
            cleaned_u, is_invalid_url = clean_url(raw_url)
            row_dict[url_col] = cleaned_u
            if is_invalid_url:
                invalid_urls_cleaned += 1
                
        # Case company name
        if company_col:
            raw_company = row_dict[company_col].strip()
            cleaned_company = case_company_name(raw_company)
            row_dict[company_col] = cleaned_company
            if raw_company and raw_company != cleaned_company:
                casing_standardized += 1
                
        # Normalize status
        pipeline = target_pipeline
        if not pipeline:
            pipeline = detect_pipeline_type(row_dict, source_col, status_col)
            
        if status_col:
            raw_status = row_dict[status_col]
            normalized = normalize_status(raw_status, pipeline)
            row_dict[status_col] = normalized
            
        processed_records.append({
            'original_index': idx,
            'data': row_dict,
            'score': parsed_score_val,
            'company': row_dict[company_col].strip() if company_col else "",
            'email': row_dict[email_col].strip() if email_col else "",
            'source': row_dict[source_col].strip() if source_col else ""
        })
        
    # Deduplicate processed records using Disjoint Set Union (DSU) / Union-Find.
    n = len(processed_records)
    dsu = DSU(n)
    
    generic_companies = {"self-employed", "freelance", "none", "n/a", "unknown", "private", "individual"}
    
    company_to_idx = {}
    email_to_idx = {}
    
    for r in processed_records:
        idx = r['original_index']
        comp = r['company'].strip()
        email = r['email'].strip()
        
        comp_lower = comp.lower()
        email_lower = email.lower()
        
        if comp_lower and comp_lower not in generic_companies:
            if comp_lower in company_to_idx:
                dsu.union(idx, company_to_idx[comp_lower])
            else:
                company_to_idx[comp_lower] = idx
                
        if email_lower:
            if email_lower in email_to_idx:
                dsu.union(idx, email_to_idx[email_lower])
            else:
                email_to_idx[email_lower] = idx
                
    # Group records by their component representative parent index
    components = defaultdict(list)
    for r in processed_records:
        parent_rep = dsu.find(r['original_index'])
        components[parent_rep].append(r)
        
    kept_records = []
    for parent_rep, recs in components.items():
        # Select the record to keep based on:
        # highest score, on tie, the lowest original index
        best_rec = min(recs, key=lambda x: (-x['score'], x['original_index']))
        kept_records.append(best_rec)
        
    # Maintain original row stability by sorting kept records by original_index at the end
    kept_records.sort(key=lambda x: x['original_index'])
    
    duplicates_removed = len(processed_records) - len(kept_records)
    
    # Write output CSV
    with open(output_path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for r in kept_records:
            # Build the row using header keys
            out_row = [r['data'][h] for h in headers]
            writer.writerow(out_row)
            
    # Calculate statistics
    # 1. Average lead value
    lead_values = []
    for r in kept_records:
        if value_col:
            val_float = parse_float_value(r['data'][value_col])
            if val_float is not None:
                lead_values.append(val_float)
                
    average_lead_value = sum(lead_values) / len(lead_values) if lead_values else 0.0
    
    # 2. Priority distribution
    low_count = 0
    med_count = 0
    high_count = 0
    for r in kept_records:
        score = r['score']
        if score < 40:
            low_count += 1
        elif score <= 79:
            med_count += 1
        else:
            high_count += 1
            
    priority_distribution = {
        "LOW": low_count,
        "MEDIUM": med_count,
        "HIGH": high_count
    }
    
    # 3. Source efficiency
    # Group kept leads by source (strip, lowercase is best for keys, but output original/capitalized standard or cleaned)
    # Let's keep source names trimmed.
    source_leads_map = defaultdict(list)
    for r in kept_records:
        src = r['source']  # Already trimmed
        source_leads_map[src].append(r)
        
    source_efficiency = {}
    for src, leads in source_leads_map.items():
        total_in_src = len(leads)
        won_in_src = 0
        for r in leads:
            status_val = r['data'].get(status_col, "") if status_col else ""
            family = get_stage_family(status_val)
            if family == 'won':
                won_in_src += 1
                
        success_rate = (won_in_src / total_in_src) * 100.0 if total_in_src > 0 else 0.0
        source_efficiency[src] = success_rate
        
    # Write report json
    report_data = {
        "average_lead_value": average_lead_value,
        "priority_distribution": priority_distribution,
        "source_efficiency": source_efficiency,
        "errors_summary": {
            "duplicates_removed": duplicates_removed,
            "invalid_emails_cleaned": invalid_emails_cleaned,
            "invalid_urls_cleaned": invalid_urls_cleaned,
            "missing_scores_filled": missing_scores_filled,
            "casing_standardized": casing_standardized
        }
    }
    
    with open(report_path, mode='w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=4)


if __name__ == '__main__':
    # CLI mode
    import sys
    if len(sys.argv) < 4:
        print("Usage: python csv_processor.py <input_csv> <output_csv> <report_json>")
        sys.exit(1)
    process_csv(sys.argv[1], sys.argv[2], sys.argv[3])
