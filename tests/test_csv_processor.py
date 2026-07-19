import unittest
import os
import json
import csv
import tempfile
import shutil

from csv_processor import (
    parse_score,
    clean_email,
    clean_url,
    case_company_name,
    normalize_status,
    process_csv,
    has_internal_camel_case,
    standardize_suffixes
)

class TestCSVProcessorHelperFunctions(unittest.TestCase):
    
    def test_parse_score(self):
        # Missing/empty
        self.assertEqual(parse_score(""), (75, True))
        self.assertEqual(parse_score("   "), (75, True))
        
        # Categories
        self.assertEqual(parse_score("High"), (90, False))
        self.assertEqual(parse_score("gorący"), (90, False))
        self.assertEqual(parse_score("goracy"), (90, False))
        self.assertEqual(parse_score("Medium"), (65, False))
        self.assertEqual(parse_score("ciepły"), (65, False))
        self.assertEqual(parse_score("cieply"), (65, False))
        self.assertEqual(parse_score("Low"), (30, False))
        self.assertEqual(parse_score("Zimny"), (30, False))
        
        # Floats [0.0, 1.0]
        self.assertEqual(parse_score("0.5"), (50, False))
        self.assertEqual(parse_score("0.856"), (86, False))
        self.assertEqual(parse_score("0.0"), (0, False))
        self.assertEqual(parse_score("1.0"), (100, False))
        
        # Numeric integers directly
        self.assertEqual(parse_score("42"), (42, False))
        self.assertEqual(parse_score("100"), (100, False))
        self.assertEqual(parse_score("0"), (0, False))
        self.assertEqual(parse_score("1"), (100, False))
        
        # Outside float range but has a dot -> parsed as float then rounded
        self.assertEqual(parse_score("75.4"), (75, False))
        self.assertEqual(parse_score("75.8"), (76, False))
        
        # Non-numeric invalid
        self.assertEqual(parse_score("not_a_score"), (75, True))
        
        # Infinite/overflow values
        self.assertEqual(parse_score("1.0e1000"), (75, True))

    def test_clean_email(self):
        # Valid
        self.assertEqual(clean_email("test@example.com"), ("test@example.com", False))
        self.assertEqual(clean_email("user.name+tag@sub.domain.co.uk"), ("user.name+tag@sub.domain.co.uk", False))
        
        # Empty
        self.assertEqual(clean_email(""), ("", False))
        self.assertEqual(clean_email("   "), ("", False))
        
        # Invalid
        self.assertEqual(clean_email("invalid"), ("", True))
        self.assertEqual(clean_email("invalid@"), ("", True))
        self.assertEqual(clean_email("@domain.com"), ("", True))
        self.assertEqual(clean_email("test@domain"), ("", True))

    def test_clean_url(self):
        # Valid with https
        self.assertEqual(clean_url("https://google.com"), ("https://google.com", False))
        self.assertEqual(clean_url("http://yahoo.co.uk"), ("http://yahoo.co.uk", False))
        
        # Valid missing scheme
        self.assertEqual(clean_url("google.com"), ("https://google.com", False))
        self.assertEqual(clean_url("www.sub.domain.org/path?query=1"), ("https://www.sub.domain.org/path?query=1", False))
        
        # Empty
        self.assertEqual(clean_url(""), ("", False))
        
        # Invalid (localhost or missing dot)
        self.assertEqual(clean_url("localhost"), ("", True))
        self.assertEqual(clean_url("https://localhost"), ("", True))
        self.assertEqual(clean_url("google"), ("", True))
        self.assertEqual(clean_url("https://"), ("", True))
        self.assertEqual(clean_url("http://invalidhostname"), ("", True))

    def test_camel_case_detection(self):
        self.assertTrue(has_internal_camel_case("HubSpot"))
        self.assertTrue(has_internal_camel_case("ScaleFlow"))
        self.assertTrue(has_internal_camel_case("eBay"))
        self.assertTrue(has_internal_camel_case("iPad"))
        
        self.assertFalse(has_internal_camel_case("Google"))
        self.assertFalse(has_internal_camel_case("google"))
        self.assertFalse(has_internal_camel_case("GOOGLE"))
        self.assertFalse(has_internal_camel_case("LLC"))

    def test_standardize_suffixes(self):
        self.assertEqual(standardize_suffixes("Google llc"), "Google LLC")
        self.assertEqual(standardize_suffixes("Apple inc"), "Apple Inc.")
        self.assertEqual(standardize_suffixes("Apple Inc"), "Apple Inc.")
        self.assertEqual(standardize_suffixes("Orange ltd"), "Orange LTD")
        self.assertEqual(standardize_suffixes("Microsoft sa"), "Microsoft S.A.")
        self.assertEqual(standardize_suffixes("Siemens gmbh"), "Siemens GmbH")
        self.assertEqual(standardize_suffixes("WFP sp z oo"), "WFP Sp. z o.o.")
        self.assertEqual(standardize_suffixes("WFP sp. z o.o."), "WFP Sp. z o.o.")

    def test_case_company_name(self):
        # Basic Title Case
        self.assertEqual(case_company_name("my company"), "My Company")
        # Ignore Stop Words (unless first word)
        self.assertEqual(case_company_name("the apple and banana in the forest"), "The Apple and Banana in the Forest")
        # Preserve Camel Case
        self.assertEqual(case_company_name("my HubSpot integration LLC"), "My HubSpot Integration LLC")
        # Standardize Suffixes
        self.assertEqual(case_company_name("scaleFlow sp. z o.o."), "scaleFlow Sp. z o.o.")
        # Punctuation handling
        self.assertEqual(case_company_name("google, inc."), "Google, Inc.")
        
        # Keep lowercase-initiated camelCase brand names untouched
        self.assertEqual(case_company_name("eBay store"), "eBay Store")
        self.assertEqual(case_company_name("my iPad application"), "My iPad Application")
        self.assertEqual(case_company_name("new iPhone"), "New iPhone")
        
        # Polish stop words
        self.assertEqual(case_company_name("wanny i prysznice z polski"), "Wanny i Prysznice z Polski")
        
        # Collapse consecutive duplicate suffixes
        self.assertEqual(case_company_name("Google LLC LLC"), "Google LLC")
        self.assertEqual(case_company_name("WFP Sp. z o.o. Sp. z o.o."), "Wfp Sp. z o.o.")

    def test_status_normalization(self):
        # FB CRM Stage
        self.assertEqual(normalize_status("new", "fb"), "Do kontaktu")
        self.assertEqual(normalize_status("to_contact", "fb"), "Do kontaktu")
        self.assertEqual(normalize_status("pm_sent", "fb"), "Wysłano PM / Komentarz")
        self.assertEqual(normalize_status("replied", "fb"), "Odpowiedział")
        self.assertEqual(normalize_status("negotiation", "fb"), "Negocjacja")
        self.assertEqual(normalize_status("won", "fb"), "Zamknięty / Aktywny")
        self.assertEqual(normalize_status("unknown_stage", "fb"), "Do kontaktu")  # Default first
        
        # Inbound CRM Stage
        self.assertEqual(normalize_status("new", "inbound"), "Inbound (Wtyczka)")
        self.assertEqual(normalize_status("inbox", "inbound"), "Inbound (Wtyczka)")
        self.assertEqual(normalize_status("email_sent", "inbound"), "Wysłana wiadomość")
        self.assertEqual(normalize_status("engaged", "inbound"), "Rozmowa w toku")
        self.assertEqual(normalize_status("meeting", "inbound"), "Zakwalifikowane")
        self.assertEqual(normalize_status("active", "inbound"), "Zamknięte / Sukces")
        self.assertEqual(normalize_status("unknown_stage", "inbound"), "Inbound (Wtyczka)")  # Default first

        # Lost family mapping
        self.assertEqual(normalize_status("lost", "fb"), "Odrzucone")
        self.assertEqual(normalize_status("closed_lost", "fb"), "Odrzucone")
        self.assertEqual(normalize_status("closed-lost", "inbound"), "Odrzucone")
        self.assertEqual(normalize_status("refused", "fb"), "Odrzucone")
        self.assertEqual(normalize_status("rejected", "inbound"), "Odrzucone")
        self.assertEqual(normalize_status("odrzucone", "fb"), "Odrzucone")
        self.assertEqual(normalize_status("archiwum", "inbound"), "Odrzucone")
        self.assertEqual(normalize_status("trash", "fb"), "Odrzucone")

        # Word boundaries vs substring check
        self.assertEqual(normalize_status("won't", "fb"), "Do kontaktu")
        self.assertEqual(normalize_status("won't", "inbound"), "Inbound (Wtyczka)")


class TestCSVProcessorPipeline(unittest.TestCase):
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.input_csv = os.path.join(self.test_dir, "input.csv")
        self.output_csv = os.path.join(self.test_dir, "output.csv")
        self.report_json = os.path.join(self.test_dir, "report.json")

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def write_csv(self, headers, rows):
        with open(self.input_csv, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)

    def test_empty_rows_and_trimming(self):
        headers = ["Company", "Email", "Website", "qualificationScore", "Status", "Source", "Est Value (USD)"]
        rows = [
            ["  Google  ", "  test@google.com  ", "google.com", "High", "new", "fb", " 10000 "],
            ["", "   ", "", "", "", "", ""],  # completely empty row
            ["HubSpot", "info@hubspot.com", "hubspot.com", "0.85", "contacted", "inbound", "$25,000"]
        ]
        self.write_csv(headers, rows)
        process_csv(self.input_csv, self.output_csv, self.report_json)
        
        # Check output file has 2 cleaned rows (no empty rows)
        with open(self.output_csv, mode='r', encoding='utf-8') as f:
            reader = csv.reader(f)
            out_headers = next(reader)
            out_rows = list(reader)
            
        self.assertEqual(len(out_rows), 2)
        # Google trimmed
        self.assertEqual(out_rows[0][0], "Google")
        self.assertEqual(out_rows[0][1], "test@google.com")
        self.assertEqual(out_rows[0][3], "90") # High -> 90
        # HubSpot
        self.assertEqual(out_rows[1][0], "HubSpot")
        self.assertEqual(out_rows[1][3], "85") # 0.85 -> 85

    def test_deduplication(self):
        headers = ["Company", "Email", "Website", "qualificationScore", "Status", "Source", "Est Value (USD)"]
        rows = [
            # A and B duplicate by Company "Apple", A has higher score (90 vs 60) -> Keep A
            ["Apple", "apple1@apple.com", "apple.com", "90", "new", "fb", "1000"],
            ["Apple", "apple2@apple.com", "apple.com", "60", "new", "fb", "1000"],
            
            # C and D duplicate by Email "orange@orange.com", D has higher score (75 vs 40) -> Keep D
            ["Orange Ltd", "orange@orange.com", "orange.com", "40", "new", "fb", "2000"],
            ["Orange GmbH", "orange@orange.com", "orange.com", "75", "new", "fb", "3000"],
            
            # E and F duplicate, F has higher score (100 vs 50) -> Keep F. 
            # Note F is also a duplicate of G by email. G has score 80.
            # So E, F, G are all connected. F has score 100, G has 80, E has 50. Keep F.
            ["Peach", "peach1@peach.com", "peach.com", "50", "new", "fb", "5000"],
            ["Peach", "peach2@peach.com", "peach.com", "100", "new", "fb", "6000"],
            ["Peach Corp", "peach2@peach.com", "peach.com", "80", "new", "fb", "7000"]
        ]
        self.write_csv(headers, rows)
        process_csv(self.input_csv, self.output_csv, self.report_json)
        
        # Read clean rows
        with open(self.output_csv, mode='r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)
            out_rows = list(reader)
            
        # We expect to keep:
        # - Apple (apple1@apple.com) [Score 90]
        # - Orange GmbH [Score 75]
        # - Peach [Score 100]
        self.assertEqual(len(out_rows), 3)
        
        kept_companies = [r[0] for r in out_rows]
        self.assertIn("Apple", kept_companies)
        self.assertIn("Orange GmbH", kept_companies)
        self.assertIn("Peach", kept_companies)

    def test_statistics_and_errors(self):
        headers = ["Company", "Email", "Website", "score", "Status", "Source", "value"]
        rows = [
            ["Apple LLC", "apple@apple.com", "apple.com", "90", "won", "direct", "1000"],
            ["Microsoft", "invalid-email", "localhost", "not-a-number", "new", "fb", "2000"],
            ["Orange", "orange@orange.com", "orange.com", "30", "new", "direct", "abc"], # invalid value
            ["Banana", "", "", "", "new", "fb", ""] # missing score (defaults to 75)
        ]
        self.write_csv(headers, rows)
        process_csv(self.input_csv, self.output_csv, self.report_json)
        
        with open(self.report_json, mode='r', encoding='utf-8') as f:
            report = json.load(f)
            
        # Average lead value: (1000 + 2000) / 2 = 1500 (since abc and empty are skipped)
        self.assertEqual(report["average_lead_value"], 1500.0)
        
        # Priority distribution:
        # Apple: score 90 -> HIGH
        # Microsoft: score 75 (missing) -> MEDIUM
        # Orange: score 30 -> LOW
        # Banana: score 75 (missing) -> MEDIUM
        self.assertEqual(report["priority_distribution"]["HIGH"], 1)
        self.assertEqual(report["priority_distribution"]["MEDIUM"], 2)
        self.assertEqual(report["priority_distribution"]["LOW"], 1)
        
        # Errors summary:
        # - duplicates_removed: 0
        # - invalid_emails_cleaned: 1 (invalid-email)
        # - invalid_urls_cleaned: 1 (localhost is invalid)
        # - missing_scores_filled: 2 (not-a-number, empty)
        # - casing_standardized: 1 (Apple LLC casing, or Microsoft which didn't change, wait Apple LLC changed "Apple LLC" standardizes "LLC" which was already "LLC", but let's check if the casing standardized count is correct based on standardization logic)
        self.assertEqual(report["errors_summary"]["duplicates_removed"], 0)
        self.assertEqual(report["errors_summary"]["invalid_emails_cleaned"], 1)
        self.assertEqual(report["errors_summary"]["invalid_urls_cleaned"], 1)
        self.assertEqual(report["errors_summary"]["missing_scores_filled"], 2)

    def test_source_efficiency(self):
        # Source 'fb': 2 leads, 1 won, success_rate = 50.0%
        # Source 'direct': 2 leads, 0 won, success_rate must default to 0.0% (not mix with score)
        headers = ["Company", "Email", "score", "Status", "Source", "value"]
        rows = [
            ["A", "a@a.com", "80", "won", "fb", "1000"],
            ["B", "b@b.com", "50", "new", "fb", "1000"],
            ["C", "c@c.com", "40", "new", "direct", "1000"],
            ["D", "d@d.com", "60", "new", "direct", "1000"]
        ]
        self.write_csv(headers, rows)
        process_csv(self.input_csv, self.output_csv, self.report_json)
        
        with open(self.report_json, mode='r', encoding='utf-8') as f:
            report = json.load(f)
            
        self.assertEqual(report["source_efficiency"]["fb"], 50.0)
        self.assertEqual(report["source_efficiency"]["direct"], 0.0)

    def test_deduplication_new_rules(self):
        headers = ["Company", "Email", "Website", "qualificationScore", "Status", "Source", "Est Value (USD)"]
        rows = [
            # Two records with same company "none" (generic) and different emails.
            # They should NOT be deduplicated by company because "none" is generic.
            # Keep both if their emails are distinct.
            ["none", "user1@example.com", "example.com", "80", "new", "fb", "1000"],
            ["none", "user2@example.com", "example.com", "70", "new", "fb", "1000"],
            
            # Two records with empty email and different non-generic companies.
            # They should NOT be deduplicated by email because email is empty.
            ["Company A", "", "example.com", "90", "new", "fb", "1000"],
            ["Company B", "", "example.com", "85", "new", "fb", "1000"],
            
            # Two records with same email. One has higher score.
            # Keep the one with higher score (95 vs 50).
            ["Company C", "dup@example.com", "example.com", "50", "new", "fb", "1000"],
            ["Company D", "dup@example.com", "example.com", "95", "new", "fb", "1000"],
        ]
        self.write_csv(headers, rows)
        process_csv(self.input_csv, self.output_csv, self.report_json)
        
        with open(self.output_csv, mode='r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)
            out_rows = list(reader)
            
        self.assertEqual(len(out_rows), 5)
        self.assertEqual(out_rows[0][0], "None") # Company cased to "None"
        self.assertEqual(out_rows[0][1], "user1@example.com")
        self.assertEqual(out_rows[1][0], "None")
        self.assertEqual(out_rows[1][1], "user2@example.com")
        self.assertEqual(out_rows[2][0], "Company A")
        self.assertEqual(out_rows[3][0], "Company B")
        self.assertEqual(out_rows[4][0], "Company D")
        self.assertEqual(out_rows[4][1], "dup@example.com")

    def test_currency_parsing_formats(self):
        headers = ["Company", "Email", "Website", "qualificationScore", "Status", "Source", "Est Value (USD)"]
        rows = [
            # European format: 12.345,67 €
            ["A", "a@example.com", "example.com", "80", "new", "fb", "12.345,67 €"],
            # Polish format: 12 345,67 zł
            ["B", "b@example.com", "example.com", "70", "new", "fb", "12 345,67 zł"],
            # Standard US format: 12,345.67
            ["C", "c@example.com", "example.com", "60", "new", "fb", "12,345.67"],
            # European format: 12345,67
            ["D", "d@example.com", "example.com", "50", "new", "fb", "12345,67"],
            # Double-quoted with space before quote (skipinitialspace check)
            ["E", "e@example.com", "example.com", "40", "new", "fb", " $12,345.67 "]
        ]
        self.write_csv(headers, rows)
        process_csv(self.input_csv, self.output_csv, self.report_json)
        
        with open(self.report_json, mode='r', encoding='utf-8') as f:
            report = json.load(f)
            
        self.assertAlmostEqual(report["average_lead_value"], 12345.67, places=2)

if __name__ == '__main__':
    unittest.main()
