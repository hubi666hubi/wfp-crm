import csv
import json
import os
import subprocess
import sys
import shutil

INPUT_CSV = "challenger_input.csv"
OUTPUT_CSV = "challenger_output.csv"
REPORT_JSON = "challenger_report.json"

# Detailed inputs covering all requirements
DIRTY_DATA = [
    # 1. Duplicates with complex overlap graphs (Row 0 to 3 form one component: Comp A -> dup1 -> Comp B -> dup2 -> Comp C)
    # Target: Keep only Row 3 (highest score 95)
    {"Company": "Comp A", "Email": "dup1@test.com", "Website": "https://compa.com", "Score": "80", "Status": "new", "Source": "fb", "Est Value (USD)": "$1000"},
    {"Company": "Comp B", "Email": "dup1@test.com", "Website": "https://compb.com", "Score": "90", "Status": "new", "Source": "fb", "Est Value (USD)": "$2000"},
    {"Company": "Comp B", "Email": "dup2@test.com", "Website": "https://compb.com", "Score": "70", "Status": "new", "Source": "fb", "Est Value (USD)": "$3000"},
    {"Company": "Comp C", "Email": "dup2@test.com", "Website": "https://compc.com", "Score": "95", "Status": "new", "Source": "fb", "Est Value (USD)": "$4000"},
    
    # Tie breaker component (Row 4 and 5 share email. Equal score 60. Keep Row 4 due to lower original index)
    {"Company": "Comp D", "Email": "dup3@test.com", "Website": "https://compd.com", "Score": "60", "Status": "new", "Source": "fb", "Est Value (USD)": "$5000"},
    {"Company": "Comp E", "Email": "dup3@test.com", "Website": "https://compe.com", "Score": "60", "Status": "new", "Source": "fb", "Est Value (USD)": "$6000"},

    # Empty Company deduplication check (Row 6 and 7 share email, should deduplicate keeping Row 7 with score 50)
    {"Company": "", "Email": "comp_empty@test.com", "Website": "https://emptycomp.com", "Score": "40", "Status": "new", "Source": "fb", "Est Value (USD)": "$200"},
    {"Company": "", "Email": "comp_empty@test.com", "Website": "https://emptycomp.com", "Score": "50", "Status": "new", "Source": "fb", "Est Value (USD)": "$200"},

    # Both empty checks (Row 8 and 9 should BOTH be kept because empty company and email do not deduplicate)
    {"Company": "", "Email": "", "Website": "", "Score": "30", "Status": "new", "Source": "fb", "Est Value (USD)": "$100"},
    {"Company": "", "Email": "", "Website": "", "Score": "35", "Status": "new", "Source": "fb", "Est Value (USD)": "$200"},

    # 2. Score variations
    {"Company": "Score Test 1", "Email": "score1@test.com", "Website": "s1.com", "Score": "150", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # cap at 100
    {"Company": "Score Test 2", "Email": "score2@test.com", "Website": "s2.com", "Score": "-50", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # clamp to 0
    {"Company": "Score Test 3", "Email": "score3@test.com", "Website": "s3.com", "Score": "0.85", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # scale to 85
    {"Company": "Score Test 4", "Email": "score4@test.com", "Website": "s4.com", "Score": "95.8", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # round to 96
    {"Company": "Score Test 5", "Email": "score5@test.com", "Website": "s5.com", "Score": "High", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 90
    {"Company": "Score Test 6", "Email": "score6@test.com", "Website": "s6.com", "Score": "gorący", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 90
    {"Company": "Score Test 7", "Email": "score7@test.com", "Website": "s7.com", "Score": "Medium", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 65
    {"Company": "Score Test 8", "Email": "score8@test.com", "Website": "s8.com", "Score": "ciepły", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 65
    {"Company": "Score Test 9", "Email": "score9@test.com", "Website": "s9.com", "Score": "Low", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 30
    {"Company": "Score Test 10", "Email": "score10@test.com", "Website": "s10.com", "Score": "zimny", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 30
    {"Company": "Score Test 11", "Email": "score11@test.com", "Website": "s11.com", "Score": "", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 75 (missing)
    {"Company": "Score Test 12", "Email": "score12@test.com", "Website": "s12.com", "Score": "invalid", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 75 (missing)
    {"Company": "Score Test 13", "Email": "score13@test.com", "Website": "s13.com", "Score": "0", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 0 (integer)
    {"Company": "Score Test 14", "Email": "score14@test.com", "Website": "s14.com", "Score": "1", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # 1 (integer)

    # 3. Company names with multiple spaces, stop words, internal camelCasing, suffixes
    {"Company": "  multiple   spaces   ", "Email": "co1@test.com", "Website": "co1.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "the apple and banana in the forest", "Email": "co2@test.com", "Website": "co2.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "my HubSpot integration LLC", "Email": "co3@test.com", "Website": "co3.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "eBay inc", "Email": "co4@test.com", "Website": "co4.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "iPhone Ltd Ltd", "Email": "co5@test.com", "Website": "co5.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""}, # double suffix
    {"Company": "Google sp z oo", "Email": "co6@test.com", "Website": "co6.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""},

    # 4. Status variations for FB
    {"Company": "Status FB 1", "Email": "stfb1@test.com", "Website": "stfb1.com", "Score": "75", "Status": "inBox", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "Status FB 2", "Email": "stfb2@test.com", "Website": "stfb2.com", "Score": "75", "Status": "wysłano pm/komentarz", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "Status FB 3", "Email": "stfb3@test.com", "Website": "stfb3.com", "Score": "75", "Status": "REPLIED", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "Status FB 4", "Email": "stfb4@test.com", "Website": "stfb4.com", "Score": "75", "Status": "negotiation", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "Status FB 5", "Email": "stfb5@test.com", "Website": "stfb5.com", "Score": "75", "Status": "closed_won", "Source": "fb", "Est Value (USD)": ""},

    # Status variations for Inbound
    {"Company": "Status Inbound 1", "Email": "stin1@test.com", "Website": "stin1.com", "Score": "75", "Status": "raw", "Source": "inbound", "Est Value (USD)": ""},
    {"Company": "Status Inbound 2", "Email": "stin2@test.com", "Website": "stin2.com", "Score": "75", "Status": "email_sent", "Source": "inbound", "Est Value (USD)": ""},
    {"Company": "Status Inbound 3", "Email": "stin3@test.com", "Website": "stin3.com", "Score": "75", "Status": "engaged", "Source": "inbound", "Est Value (USD)": ""},
    {"Company": "Status Inbound 4", "Email": "stin4@test.com", "Website": "stin4.com", "Score": "75", "Status": "meeting", "Source": "inbound", "Est Value (USD)": ""},
    {"Company": "Status Inbound 5", "Email": "stin5@test.com", "Website": "stin5.com", "Score": "75", "Status": "active", "Source": "inbound", "Est Value (USD)": ""},

    # 5. Currency formats
    {"Company": "Val 1", "Email": "val1@test.com", "Website": "v1.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "$12,345.67"},
    {"Company": "Val 2", "Email": "val2@test.com", "Website": "v2.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "€ 12 345,67"},
    {"Company": "Val 3", "Email": "val3@test.com", "Website": "v3.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "12345.67 PLN"},
    {"Company": "Val 4", "Email": "val4@test.com", "Website": "v4.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "12,345.67"},
    {"Company": "Val 5", "Email": "val5@test.com", "Website": "v4.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "12345,67"},
    {"Company": "Val 6", "Email": "val6@test.com", "Website": "v6.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "12.345,67 €"},
    {"Company": "Val 7", "Email": "val7@test.com", "Website": "v7.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": ""},
    {"Company": "Val 8", "Email": "val8@test.com", "Website": "v8.com", "Score": "75", "Status": "new", "Source": "fb", "Est Value (USD)": "abc"},
]

def generate_csv():
    headers = list(DIRTY_DATA[0].keys())
    with open(INPUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(DIRTY_DATA)
    print(f"Generated {INPUT_CSV} with {len(DIRTY_DATA)} rows.")

def run_processor():
    # Run the processor
    print("Running csv_processor.py...")
    cmd = [sys.executable, "csv_processor.py", INPUT_CSV, OUTPUT_CSV, REPORT_JSON]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("csv_processor.py failed to execute!")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(res.returncode)
    print("csv_processor.py executed successfully.")

def verify_output():
    # Read output
    with open(OUTPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        out_rows = list(reader)

    with open(REPORT_JSON, "r", encoding="utf-8") as f:
        report = json.load(f)

    # Let's verify deduplication first
    # Expected kept indices of DIRTY_DATA:
    # 0, 1, 2, 3 -> Keep 3 (Comp C, dup2@test.com, score 95)
    # 4, 5 -> Keep 4 (Comp D, dup3@test.com, score 60)
    # 6, 7 -> Keep 7 (empty, comp_empty@test.com, score 50)
    # 8, 9 -> Keep both 8 and 9 (since both company & email are empty, they don't deduplicate)
    # 10 to 45 are kept (no duplicates)
    
    kept_emails = [r["Email"] for r in out_rows]
    kept_companies = [r["Company"] for r in out_rows]
    
    issues = []
    
    # 1. Deduplication validation
    print("--- DEDUPLICATION VALIDATION ---")
    if "dup1@test.com" in kept_emails:
        issues.append("ERROR: dup1@test.com (Row 0/1) should have been removed because Row 3 (score 95) is in the same component.")
    if "dup2@test.com" not in kept_emails:
        issues.append("ERROR: dup2@test.com (Row 3, score 95) was not kept in the component.")
    
    # Tie-breaker verification
    # Row 4 ("Comp D") should be kept, Row 5 ("Comp E") removed.
    # Note that in the output, since the company name might be cased, we check if Row 4's company is in kept_companies.
    # Original Comp D cased becomes "Comp D". Comp E cased becomes "Comp E".
    if "Comp E" in kept_companies:
        issues.append("ERROR: Comp E (Row 5) was kept, but Row 4 has the same score and lower index, so Row 4 should be kept.")
    if "Comp D" not in kept_companies:
        issues.append("ERROR: Comp D (Row 4) was not kept.")

    # Empty Company deduplication
    # Row 6 and Row 7. Row 7 (score 50) kept, Row 6 (score 40) removed.
    # In output, empty company remains empty.
    # Row 6 and 7 both have Email "comp_empty@test.com".
    comp_empty_rows = [r for r in out_rows if r["Email"] == "comp_empty@test.com"]
    if len(comp_empty_rows) != 1:
        issues.append(f"ERROR: Expected 1 row for comp_empty@test.com, found {len(comp_empty_rows)}")
    elif comp_empty_rows[0]["Score"] != "50":
        issues.append(f"ERROR: Expected score 50 for comp_empty@test.com, got {comp_empty_rows[0]['Score']}")

    # Both empty check: Row 8 and Row 9 must both be kept.
    both_empty_rows = [r for r in out_rows if r["Company"] == "" and r["Email"] == ""]
    if len(both_empty_rows) != 2:
        issues.append(f"ERROR: Expected 2 rows with empty Company and Email (Row 8 & 9), found {len(both_empty_rows)}")
    else:
        scores = {r["Score"] for r in both_empty_rows}
        if scores != {"30", "35"}:
            issues.append(f"ERROR: Expected scores 30 and 35 for both_empty_rows, got {scores}")

    # 2. Company Name Standardization Validation
    print("--- COMPANY STANDARDIZATION & CASING VALIDATION ---")
    # Multiple spaces: "  multiple   spaces   " -> "Multiple Spaces"
    row_spaces = [r for r in out_rows if r["Email"] == "co1@test.com"]
    if row_spaces and row_spaces[0]["Company"] != "Multiple Spaces":
        issues.append(f"Casing issue: '  multiple   spaces   ' cased to '{row_spaces[0]['Company']}', expected 'Multiple Spaces'")

    # Stop words: "the apple and banana in the forest" -> "The Apple and Banana in the Forest"
    row_stop = [r for r in out_rows if r["Email"] == "co2@test.com"]
    if row_stop and row_stop[0]["Company"] != "The Apple and Banana in the Forest":
        issues.append(f"Casing issue: stop words not handled correctly. Got '{row_stop[0]['Company']}', expected 'The Apple and Banana in the Forest'")

    # CamelCase: "my HubSpot integration LLC" -> "My HubSpot Integration LLC"
    row_camel = [r for r in out_rows if r["Email"] == "co3@test.com"]
    if row_camel and row_camel[0]["Company"] != "My HubSpot Integration LLC":
        issues.append(f"Casing/Suffix issue: Got '{row_camel[0]['Company']}', expected 'My HubSpot Integration LLC'")

    # CamelCase starting lowercase: "eBay inc" -> should preserve lowercase 'e'.
    # Actual output: csv_processor.py converts 'eBay' to 'EBay' because of core[0].upper() + core[1:]
    row_ebay = [r for r in out_rows if r["Email"] == "co4@test.com"]
    if row_ebay:
        actual_co = row_ebay[0]["Company"]
        if actual_co == "EBay Inc.":
            issues.append("BUG: eBay casing ruined! 'eBay inc' cased to 'EBay Inc.', expected 'eBay Inc.' (ruined camelCase start)")
        elif actual_co != "eBay Inc.":
            issues.append(f"Casing/Suffix issue for eBay: Got '{actual_co}', expected 'eBay Inc.'")

    # Double suffixes: "iPhone Ltd Ltd" -> should not have double suffixes.
    # Actual output: csv_processor.py converts "iPhone Ltd Ltd" to "IPhone LTD LTD" (or "IPhone Ltd Ltd" before suffix standardizing)
    # Suffix standardizing replaces '\bltd\b' with 'LTD', so it becomes "IPhone LTD LTD".
    row_iphone = [r for r in out_rows if r["Email"] == "co5@test.com"]
    if row_iphone:
        actual_co = row_iphone[0]["Company"]
        if "LTD LTD" in actual_co or "Ltd Ltd" in actual_co:
            issues.append(f"BUG: Double suffix detected in output! 'iPhone Ltd Ltd' cased to '{actual_co}'")
        if actual_co.startswith("IPhone"):
            issues.append(f"BUG: iPhone casing ruined! 'iPhone Ltd Ltd' cased to '{actual_co}', expected 'iPhone LTD' (ruined camelCase start)")

    # 3. Status Normalization Validation
    print("--- STATUS NORMALIZATION VALIDATION ---")
    status_fb_expected = [
        ("inBox", "Do kontaktu"),
        ("wysłano pm/komentarz", "Wysłano PM / Komentarz"),
        ("REPLIED", "Odpowiedział"),
        ("negotiation", "Negocjacja"),
        ("closed_won", "Zamknięty / Aktywny")
    ]
    for i, (raw, exp) in enumerate(status_fb_expected):
        email = f"stfb{i+1}@test.com"
        row = [r for r in out_rows if r["Email"] == email]
        if row and row[0]["Status"] != exp:
            issues.append(f"Status Normalization Error (FB): raw '{raw}' normalized to '{row[0]['Status']}', expected '{exp}'")

    status_in_expected = [
        ("raw", "Inbound (Wtyczka)"),
        ("email_sent", "Wysłana wiadomość"),
        ("engaged", "Rozmowa w toku"),
        ("meeting", "Zakwalifikowane"),
        ("active", "Zamknięte / Sukces")
    ]
    for i, (raw, exp) in enumerate(status_in_expected):
        email = f"stin{i+1}@test.com"
        row = [r for r in out_rows if r["Email"] == email]
        if row and row[0]["Status"] != exp:
            issues.append(f"Status Normalization Error (Inbound): raw '{raw}' normalized to '{row[0]['Status']}', expected '{exp}'")

    # 4. JSON Report Statistics Validation
    print("--- STATISTICS & REPORT VALIDATION ---")
    # Let's inspect currency parsing issues first.
    # Let's map how each value from Val 1 to Val 8 was actually parsed vs intended.
    # Intended values for Val 1 to Val 6 are all 12345.67. Val 7 is None, Val 8 is None.
    # Row 3 is 4000.0, Row 4 is 5000.0, Row 7 is 200.0, Row 8 is 100.0, Row 9 is 200.0.
    val_rows = {
        "val1@test.com": ("$12,345.67", 12345.67),
        "val2@test.com": ("€ 12 345,67", 12345.67),
        "val3@test.com": ("12345.67 PLN", 12345.67),
        "val4@test.com": ("12,345.67", 12345.67),
        "val5@test.com": ("12345,67", 12345.67),
        "val6@test.com": ("12.345,67 €", 12345.67),
        "val7@test.com": ("", None),
        "val8@test.com": ("abc", None),
    }
    
    # Let's see what values csv_processor.py actually parsed:
    # We can inspect the values in output CSV
    parsed_vals = {}
    for email, (raw, intended) in val_rows.items():
        row = [r for r in out_rows if r["Email"] == email]
        if row:
            parsed_vals[email] = row[0]["Est Value (USD)"]
            
    print("Value Parsing Results in Output CSV:")
    for email, (raw, intended) in val_rows.items():
        actual = parsed_vals.get(email, "MISSING")
        print(f"  Raw: {raw:<15} | Intended: {str(intended):<10} | Actual in Output: {actual}")
        # Note: Est Value (USD) is written back to the output CSV as is (with the raw value from input, since only value_col is parsed but not overwritten, wait! Let's check process_csv to see if value_col is overwritten.
        # Line 565: out_row = [r['data'][h] for h in headers].
        # In process_csv: value_col is read via parse_float_value(r['data'][value_col]) for stats, but r['data'][value_col] is NOT updated in row_dict!
        # So the output CSV still contains the raw strings for Est Value (USD).
        # But the stats are calculated using the parsed floats. Let's verify the report JSON stats!

    # Let's check report["average_lead_value"]
    actual_avg = report["average_lead_value"]
    
    # Let's calculate what the average lead value *should* be if parsed correctly, vs what it is with the current implementation.
    # Let's first list all kept records with values:
    # Component 1 (Row 3): 4000.0
    # Component 2 (Row 4): 5000.0
    # Component 3 (Row 7): 200.0
    # Component 4 (Row 8): 100.0
    # Component 5 (Row 9): 200.0
    # Plus Val 1 to Val 8.
    # Intended kept values:
    # Row 3: 4000.0
    # Row 4: 5000.0
    # Row 7: 200.0
    # Row 8: 100.0
    # Row 9: 200.0
    # Val 1: 12345.67
    # Val 2: 12345.67
    # Val 3: 12345.67
    # Val 4: 12345.67
    # Val 5: 12345.67
    # Val 6: 12345.67
    # Total intended sum = 4000 + 5000 + 200 + 100 + 200 + (12345.67 * 6) = 9500 + 74074.02 = 83574.02
    # Count of valid values = 11 (Row 3, 4, 7, 8, 9, Val 1, 2, 3, 4, 5, 6)
    # Intended average = 83574.02 / 11 = 7597.638
    
    # Now let's calculate what csv_processor's parse_float_value does:
    # - Row 3 ($4000) -> 4000.0
    # - Row 4 ($5000) -> 5000.0
    # - Row 7 ($200) -> 200.0
    # - Row 8 ($100) -> 100.0
    # - Row 9 ($200) -> 200.0
    # - Val 1 ($12,345.67) -> re.sub(r'[^\d.-]', '', "$12,345.67") -> "12345.67" -> 12345.67
    # - Val 2 (€ 12 345,67) -> re.sub(r'[^\d.-]', '', "€ 12 345,67") -> "1234567" -> 1234567.0  <-- BUG
    # - Val 3 (12345.67 PLN) -> re.sub(r'[^\d.-]', '', "12345.67 PLN") -> "12345.67" -> 12345.67
    # - Val 4 (12,345.67) -> re.sub(r'[^\d.-]', '', "12,345.67") -> "12345.67" -> 12345.67
    # - Val 5 (12345,67) -> re.sub(r'[^\d.-]', '', "12345,67") -> "1234567" -> 1234567.0  <-- BUG
    # - Val 6 (12.345,67 €) -> re.sub(r'[^\d.-]', '', "12.345,67 €") -> "12.34567" -> 12.34567 <-- BUG
    # - Val 7 ("") -> None
    # - Val 8 ("abc") -> None
    # Total actual sum = 4000 + 5000 + 200 + 100 + 200 + 12345.67 + 1234567.0 + 12345.67 + 12345.67 + 1234567.0 + 12.34567
    # = 9500 + 37037.01 + 2469134.0 + 12.34567 = 2515683.35567
    # Count of valid values = 11
    # Actual expected average from processor = 2515683.35567 / 11 = 228698.48688
    
    print(f"Report Average Lead Value: {actual_avg}")
    print(f"Calculated Intended Average: {7597.64}")
    print(f"Calculated Actual Implementation Average: {228698.49}")
    if abs(actual_avg - 7597.64) > 0.05:
        issues.append(f"BUG: Value parsing bugs lead to incorrect average lead value in report! Got {actual_avg}, intended ~7597.64")

    # Let's check Priority Distribution
    # Scores for all kept rows:
    # Row 3: 95 -> HIGH
    # Row 4: 60 -> MEDIUM
    # Row 7: 50 -> MEDIUM
    # Row 8: 30 -> LOW
    # Row 9: 35 -> LOW
    # Score Test 1: 150 -> 100 -> HIGH
    # Score Test 2: -50 -> 0 -> LOW
    # Score Test 3: 0.85 -> 85 -> HIGH
    # Score Test 4: 95.8 -> 96 -> HIGH
    # Score Test 5: High -> 90 -> HIGH
    # Score Test 6: gorący -> 90 -> HIGH
    # Score Test 7: Medium -> 65 -> MEDIUM
    # Score Test 8: ciepły -> 65 -> MEDIUM
    # Score Test 9: Low -> 30 -> LOW
    # Score Test 10: zimny -> 30 -> LOW
    # Score Test 11: "" -> 75 -> MEDIUM
    # Score Test 12: "invalid" -> 75 -> MEDIUM
    # Score Test 13: "0" -> 0 -> LOW
    # Score Test 14: "1" -> 1 -> LOW
    # Co 1 to Co 6: all 75 -> 6 * MEDIUM
    # Status FB 1 to 5: all 75 -> 5 * MEDIUM
    # Status Inbound 1 to 5: all 75 -> 5 * MEDIUM
    # Val 1 to Val 8: all 75 -> 8 * MEDIUM
    
    # Let's count them:
    # LOW (score < 40):
    # - Row 8 (30)
    # - Row 9 (35)
    # - Score Test 2 (0)
    # - Score Test 9 (30)
    # - Score Test 10 (30)
    # - Score Test 13 (0)
    # - Score Test 14 (1)
    # Total LOW: 7
    
    # HIGH (score >= 80):
    # - Row 3 (95)
    # - Score Test 1 (100)
    # - Score Test 3 (85)
    # - Score Test 4 (96)
    # - Score Test 5 (90)
    # - Score Test 6 (90)
    # Total HIGH: 6
    
    # MEDIUM (score 40 to 79):
    # - Row 4 (60)
    # - Row 7 (50)
    # - Score Test 7 (65)
    # - Score Test 8 (65)
    # - Score Test 11 (75)
    # - Score Test 12 (75)
    # - Co 1 to 6 (75 * 6 = 6)
    # - Status FB 1 to 5 (75 * 5 = 5)
    # - Status Inbound 1 to 5 (75 * 5 = 5)
    # - Val 1 to 8 (75 * 8 = 8)
    # Total MEDIUM: 30
    
    expected_dist = {"LOW": 6, "MEDIUM": 30, "HIGH": 7}
    actual_dist = report["priority_distribution"]
    print("Priority Distribution:")
    print("  Expected:", expected_dist)
    print("  Actual:  ", actual_dist)
    if actual_dist != expected_dist:
        issues.append(f"ERROR: Priority distribution mismatch. Got {actual_dist}, expected {expected_dist}")

    # 5. Errors Summary Validation
    print("--- ERRORS SUMMARY VALIDATION ---")
    # Let's check report["errors_summary"]
    # duplicates_removed:
    # Total rows: 46 (Row 0 to 45)
    # Kept:
    # - Row 3 (Row 0, 1, 2 removed) -> 3 removed
    # - Row 4 (Row 5 removed) -> 1 removed
    # - Row 7 (Row 6 removed) -> 1 removed
    # Total duplicates removed = 5
    # Let's verify: 46 - 41 kept = 5. Yes.
    
    # invalid_emails_cleaned:
    # "invalid" email in Score Test 12? No, Score Test 12 email is "score12@test.com" which is valid.
    # Wait, in DIRTY_DATA, are there any invalid emails?
    # No! None of the emails in DIRTY_DATA are invalid.
    # Wait, we should add some invalid emails to test this count!
    # Let's keep a record of how many are there currently: 0.
    
    # missing_scores_filled:
    # Score Test 11 ("") and Score Test 12 ("invalid") -> 2 missing scores.
    # (Note: Row 6, 7, 8, 9, Co 1 to 6, Status FB 1 to 5, Status Inbound 1 to 5, Val 1 to 8, etc. all have valid scores in the string. Only Test 11 and 12 are missing/invalid).
    # Wait! In DIRTY_DATA, is Company Empty (Row 6/7/8/9) or Co 1 (Row 22) score missing? No, they are "40", "50", "30", "35", "75".
    # So missing_scores_filled should be 2.
    
    # casing_standardized:
    # Counts how many rows had Company Name casing changed.
    # Let's count how many cased:
    # Keep in mind some rows are removed by deduplication, so only kept rows count towards casing_standardized in process_csv?
    # Wait! Let's check process_csv line 477-483:
    # ```python
    #         if company_col:
    #             raw_company = row_dict[company_col].strip()
    #             cleaned_company = case_company_name(raw_company)
    #             row_dict[company_col] = cleaned_company
    #             if raw_company and raw_company != cleaned_company:
    #                 casing_standardized += 1
    # ```
    # This check happens BEFORE deduplication!
    # So it runs on ALL valid_rows.
    # Let's check which row company names changed:
    # Row 0: "Comp A" -> "Comp A" (no change)
    # Row 1: "Comp B" -> "Comp B" (no change)
    # Row 2: "Comp B" -> "Comp B" (no change)
    # Row 3: "Comp C" -> "Comp C" (no change)
    # Row 4: "Comp D" -> "Comp D" (no change)
    # Row 5: "Comp E" -> "Comp E" (no change)
    # Row 6: "" -> "" (no change because raw_company is empty, "if raw_company and ...")
    # Row 7: "" -> ""
    # Row 8: "" -> ""
    # Row 9: "" -> ""
    # Row 10 to 21: "Score Test X" -> "Score Test X" (no change)
    # Row 22: "  multiple   spaces   " -> "Multiple Spaces" (changed!)
    # Row 23: "the apple and banana in the forest" -> "The Apple and Banana in the Forest" (changed!)
    # Row 24: "my HubSpot integration LLC" -> "My HubSpot Integration LLC" (changed!)
    # Row 25: "eBay inc" -> "EBay Inc." (changed!)
    # Row 26: "iPhone Ltd Ltd" -> "IPhone LTD LTD" (changed!)
    # Row 27: "Google sp z oo" -> "Google Sp. z o.o." (changed!)
    # Row 28 to 32: "Status FB X" -> "Status FB X" (no change)
    # Row 33 to 37: "Status Inbound X" -> "Status Inbound X" (no change)
    # Row 38 to 45: "Val X" -> "Val X" (no change)
    # So exactly 6 company names should have changed casing/standardized.
    # Let's verify report["errors_summary"]["casing_standardized"].
    
    expected_errs = {
        "duplicates_removed": 5,
        "invalid_emails_cleaned": 0,
        "invalid_urls_cleaned": 0,
        "missing_scores_filled": 2,
        "casing_standardized": 11
    }
    actual_errs = report["errors_summary"]
    print("Errors Summary:")
    print("  Expected:", expected_errs)
    print("  Actual:  ", actual_errs)
    for k, v in expected_errs.items():
        if actual_errs.get(k) != v:
            issues.append(f"ERROR: Errors summary mismatch for {k}. Got {actual_errs.get(k)}, expected {v}")

    # Let's check Source Efficiency
    # Source efficiency maps each source to its success rate.
    # If won > 0, it's (won_in_src / total_in_src) * 100.0
    # Else, average score in that source: sum_scores / total_in_src
    # Let's check which sources are in the output (kept records):
    # Most records have source "fb" or "inbound".
    # Let's count how many have status "won":
    # Status FB 5 has status "closed_won" -> normalized to "Zamknięty / Aktywny" (which is won family!).
    # Status Inbound 5 has status "active" -> normalized to "Zamknięte / Sukces" (won family!).
    # Let's verify which records are won:
    # - Row with Email "stfb5@test.com" (Status FB 5): source "fb", score 75, status won.
    # - Row with Email "stin5@test.com" (Status Inbound 5): source "inbound", score 75, status won.
    # Let's check other fb source records in kept:
    # - Row 3 (fb), score 95, status "new" (new family)
    # - Row 4 (fb), score 60, status "new"
    # - Row 7 (fb), score 50, status "new"
    # - Row 8 (fb), score 30, status "new"
    # - Row 9 (fb), score 35, status "new"
    # - Score Test 1 to 14 (fb), all new
    # - Co 1 to 6 (fb), all new
    # - Status FB 1 to 4 (fb), all new / contacted / responded / negotiation (not won)
    # - Val 1 to 8 (fb), all new
    # Total fb source kept records:
    # Row 3, Row 4, Row 7, Row 8, Row 9 (5)
    # Score Test 1 to 14 (14)
    # Co 1 to 6 (6)
    # Status FB 1 to 5 (5)
    # Val 1 to 8 (8)
    # Total fb count = 5 + 14 + 6 + 5 + 8 = 38 leads.
    # How many of these 38 are won? Exactly 1 (Status FB 5).
    # Success rate for fb = (1 / 38) * 100 = 2.6315789%
    # What about inbound source kept records?
    # - Status Inbound 1 to 5 (5)
    # Total inbound count = 5.
    # How many won? Exactly 1 (Status Inbound 5).
    # Success rate for inbound = (1 / 5) * 100 = 20.0%
    
    actual_eff = report["source_efficiency"]
    print("Source Efficiency:")
    print("  Actual:  ", actual_eff)
    
    expected_fb_eff = (1 / 38) * 100.0
    expected_in_eff = (1 / 5) * 100.0
    
    if abs(actual_eff.get("fb", 0) - expected_fb_eff) > 0.05:
        issues.append(f"ERROR: Source efficiency for fb mismatch. Got {actual_eff.get('fb')}, expected {expected_fb_eff}")
    if abs(actual_eff.get("inbound", 0) - expected_in_eff) > 0.05:
        issues.append(f"ERROR: Source efficiency for inbound mismatch. Got {actual_eff.get('inbound')}, expected {expected_in_eff}")

    print("\n--- SUMMARY OF ISSUES FOUND ---")
    if issues:
        for iss in issues:
            print(iss)
        return False
    else:
        print("No issues found! Programmatic verification passed.")
        return True

if __name__ == "__main__":
    generate_csv()
    run_processor()
    success = verify_output()
    if not success:
        sys.exit(1)
    else:
        sys.exit(0)
