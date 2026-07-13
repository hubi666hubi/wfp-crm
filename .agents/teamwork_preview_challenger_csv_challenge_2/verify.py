import os
import csv
import json
import subprocess
import traceback

def run_verification():
    agent_dir = r"c:\Users\brend\Desktop\XX2\.agents\teamwork_preview_challenger_csv_challenge_2"
    os.makedirs(agent_dir, exist_ok=True)
    
    # 1. Define paths
    csv_processor_path = r"c:\Users\brend\Desktop\XX2\csv_processor.py"
    venv_python = r"c:\Users\brend\Desktop\XX2\.venv\Scripts\python.exe"
    
    input_crash_csv = os.path.join(agent_dir, "input_crash.csv")
    output_crash_csv = os.path.join(agent_dir, "output_crash.csv")
    report_crash_json = os.path.join(agent_dir, "report_crash.json")
    
    input_clean_csv = os.path.join(agent_dir, "input_clean.csv")
    output_clean_csv = os.path.join(agent_dir, "output_clean.csv")
    report_clean_json = os.path.join(agent_dir, "report_clean.json")
    
    log_file = os.path.join(agent_dir, "verification_log.json")
    
    # 2. Write CSV with crashing edge case (score = "1.0e1000")
    headers = ["Company", "Email", "Website", "Score", "Status", "Source", "Est Value (USD)"]
    
    rows_crash = [
        # Circular overlap graph
        ["Apple", "a1@apple.com", "apple.com", "90", "won", "fb", "1000"],
        ["Apple", "a2@apple.com", "apple.com", "80", "new", "fb", "2000"],
        ["Pear", "a2@apple.com", "pear.com", "70", "new", "fb", "3000"],
        ["Pear", "a3@apple.com", "pear.com", "85", "new", "fb", "4000"],
        ["Banana", "a3@apple.com", "banana.com", "60", "new", "fb", "5000"],
        ["Banana", "a1@apple.com", "banana.com", "95", "new", "fb", "6000"],
        
        # Crashing row
        ["Crash Inc", "crash@inc.com", "crash.com", "1.0e1000", "new", "fb", "5000"]
    ]
    
    with open(input_crash_csv, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows_crash)
        
    # 3. Write clean (non-crashing) CSV with other edge cases
    rows_clean = [
        # Circular overlap graph (Row 0-5)
        ["Apple", "a1@apple.com", "apple.com", "90", "won", "fb", "1000"],
        ["Apple", "a2@apple.com", "apple.com", "80", "new", "fb", "2000"],
        ["Pear", "a2@apple.com", "pear.com", "70", "new", "fb", "3000"],
        ["Pear", "a3@apple.com", "pear.com", "85", "new", "fb", "4000"],
        ["Banana", "a3@apple.com", "banana.com", "60", "new", "fb", "5000"],
        ["Banana", "a1@apple.com", "banana.com", "95", "new", "fb", "6000"],
        
        # Suffix and casing edge cases
        ["Google LLC LLC", "g1@google.com", "google.com", "High", "NEW", "inbound", "$25,000.00"],
        ["Microsoft sa sa", "m1@microsoft.com", "microsoft.com", "0.85", "sent", "inbound", "25.000,00 €"],
        ["eBay", "info@ebay.com", "ebay.com", "cieply", "engaged", "inbound", "25 000.00 PLN"],
        
        # Status substring matching edge cases
        ["Test gmbh", "test@gmbh.com", "gmbh.com", "120.5", "won't", "fb", "1000"],
        ["Inactive Corp", "inactive@corp.com", "corp.com", "zimny", "inactive", "fb", "2000"],
        ["Off Offer", "off@offer.com", "offer.com", "low", "off", "fb", "3000"],
        ["Me LLC", "me@llc.com", "llc.com", "NaN", "me", "fb", "4000"]
    ]
    
    with open(input_clean_csv, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows_clean)
        
    results = {
        "crash_test": {"crashed": False, "error": "", "traceback": ""},
        "clean_test": {"succeeded": False, "error": "", "traceback": ""},
        "verification_checks": {}
    }
    
    # 4. Run processor on crashing CSV
    print("Running crash test...")
    try:
        cmd = [venv_python, csv_processor_path, input_crash_csv, output_crash_csv, report_crash_json]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        results["crash_test"]["crashed"] = False
        results["crash_test"]["stdout"] = res.stdout
    except subprocess.CalledProcessError as e:
        results["crash_test"]["crashed"] = True
        results["crash_test"]["error"] = e.stderr or str(e)
        print("Crash test caught a crash (as expected!):", results["crash_test"]["error"])
    except Exception as e:
        results["crash_test"]["crashed"] = True
        results["crash_test"]["error"] = str(e)
        results["crash_test"]["traceback"] = traceback.format_exc()
        
    # 5. Run processor on clean CSV
    print("Running clean test...")
    try:
        cmd = [venv_python, csv_processor_path, input_clean_csv, output_clean_csv, report_clean_json]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        results["clean_test"]["succeeded"] = True
        results["clean_test"]["stdout"] = res.stdout
    except subprocess.CalledProcessError as e:
        results["clean_test"]["succeeded"] = False
        results["clean_test"]["error"] = e.stderr or str(e)
        print("Clean test failed unexpectedly:", results["clean_test"]["error"])
    except Exception as e:
        results["clean_test"]["succeeded"] = False
        results["clean_test"]["error"] = str(e)
        results["clean_test"]["traceback"] = traceback.format_exc()
        
    # 6. Verify clean output if it succeeded
    if results["clean_test"]["succeeded"]:
        print("Verifying clean output...")
        checks = {}
        
        # Load output CSV
        output_rows = []
        with open(output_clean_csv, mode='r', encoding='utf-8') as f:
            reader = csv.reader(f)
            out_headers = next(reader)
            for r in reader:
                output_rows.append(dict(zip(out_headers, r)))
                
        # Load report JSON
        with open(report_clean_json, mode='r', encoding='utf-8') as f:
            report_data = json.load(f)
            
        # Check A: Deduplication of circular graph (Rows 0-5 in clean_rows)
        # They should be merged into a single row, specifically the one with the highest score (Banana, score 95)
        banana_rows = [r for r in output_rows if r["Company"] == "Banana"]
        apple_rows = [r for r in output_rows if r["Company"] == "Apple"]
        pear_rows = [r for r in output_rows if r["Company"] == "Pear"]
        
        checks["deduplication_circular_graph"] = {
            "num_banana_rows": len(banana_rows),
            "num_apple_rows": len(apple_rows),
            "num_pear_rows": len(pear_rows),
            "correct": len(banana_rows) == 1 and len(apple_rows) == 0 and len(pear_rows) == 0,
            "details": f"Kept Banana rows: {len(banana_rows)}, Apple rows: {len(apple_rows)}, Pear rows: {len(pear_rows)} (Expected kept only 1 Banana row with score 95)"
        }
        
        # Check B: Double suffixes & wrong casing check
        # Google LLC LLC -> should not have double suffix (but processor will keep it because it doesn't clean double suffixes)
        # Microsoft sa sa -> should not have double suffix
        # eBay -> should remain eBay (but processor will titlecase it to EBay)
        google_row = next((r for r in output_rows if "Google" in r["Company"]), None)
        microsoft_row = next((r for r in output_rows if "Microsoft" in r["Company"]), None)
        ebay_row = next((r for r in output_rows if "eBay" in r["Company"] or "EBay" in r["Company"]), None)
        
        checks["double_suffixes_and_casing"] = {
            "google_company": google_row["Company"] if google_row else None,
            "microsoft_company": microsoft_row["Company"] if microsoft_row else None,
            "ebay_company": ebay_row["Company"] if ebay_row else None,
            "google_has_double_suffix": "LLC LLC" in google_row["Company"] if google_row else False,
            "microsoft_has_double_suffix": "S.A. S.A." in microsoft_row["Company"] if microsoft_row else False,
            "ebay_wrong_casing": ebay_row["Company"] == "EBay" if ebay_row else False,
            "correct": False  # Handled in findings
        }
        
        # Check C: Math statistics verification
        # Let's verify each metric in report vs our manual expectation
        # Values in kept rows (manually verified from output_rows):
        # Row 5 (Banana): Value=6000.0, Score=95, Status="new" (normalised "Do kontaktu", family "new")
        # Row 6 (Google LLC LLC): Value=25000.0, Score=90, Status="Inbound (Wtyczka)", family "new"
        # Row 7 (Microsoft S.A. S.A.): Value=25.0 (European format bug!), Score=85, Status="Wysłana wiadomość", family "contacted"
        # Row 8 (EBay): Value=25000.0, Score=65, Status="Rozmowa w toku", family "responded"
        # Row 9 (Test GmbH): Value=1000.0, Score=100, Status="Zamknięty / Aktywny" (won't bug!), family "won"
        # Row 10 (Inactive Corp): Value=2000.0, Score=30, Status="Zamknięty / Aktywny" (inactive bug!), family "won"
        # Row 11 (Off Offer): Value=3000.0, Score=30, Status="Negocjacja" (off bug!), family "negotiation"
        # Row 12 (Me LLC): Value=4000.0, Score=75, Status="Negocjacja" (me bug!), family "negotiation"
        
        # Processor's parsed values:
        # Sum = 6000 + 25000 + 25 + 25000 + 1000 + 2000 + 3000 + 4000 = 66025
        # Count = 8
        # Processor Average = 66025 / 8 = 8253.125
        # Expected Average (without European currency bug) = (6000 + 25000 + 25000 + 25000 + 1000 + 2000 + 3000 + 4000) / 8 = 91000 / 8 = 11375.0
        
        # Priority distribution in output_rows:
        # HIGH (score >= 80): Banana(95), Google(90), Microsoft(85), Test(100) -> 4
        # MEDIUM (40 <= score <= 79): EBay(65), Me LLC(75) -> 2
        # LOW (score < 40): Inactive Corp(30), Off Offer(30) -> 2
        
        # Source efficiency in output_rows:
        # fb leads: Banana(95, new), Test(100, won), Inactive(30, won), Off(30, negotiation), Me(75, negotiation)
        # won leads: Test, Inactive -> 2 won out of 5 -> 40.0%
        # inbound leads: Google(90, new), Microsoft(85, contacted), EBay(65, responded)
        # won leads: 0 -> average score = (90 + 85 + 65)/3 = 80.0
        
        avg_value_processor = report_data["average_lead_value"]
        avg_value_math_expected = 11375.0
        avg_value_actual_processor_math = 8253.125
        
        checks["statistics"] = {
            "processor_average_lead_value": avg_value_processor,
            "math_expected_average_lead_value_without_bug": avg_value_math_expected,
            "math_expected_average_lead_value_with_bug": avg_value_actual_processor_math,
            "average_lead_value_correct_by_processor_logic": abs(avg_value_processor - avg_value_actual_processor_math) < 1e-5,
            "average_lead_value_correct_by_real_world": abs(avg_value_processor - avg_value_math_expected) < 1e-5,
            
            "priority_distribution": report_data["priority_distribution"],
            "expected_priority_distribution": {"LOW": 2, "MEDIUM": 2, "HIGH": 4},
            "priority_correct": report_data["priority_distribution"] == {"LOW": 2, "MEDIUM": 2, "HIGH": 4},
            
            "source_efficiency": report_data["source_efficiency"],
            "expected_source_efficiency": {"fb": 40.0, "inbound": 80.0},
            "source_efficiency_correct": report_data["source_efficiency"] == {"fb": 40.0, "inbound": 80.0}
        }
        
        # Status normalization matches
        # Verify status of won't, inactive, off, me
        test_gmbh = next((r for r in output_rows if "Test" in r["Company"]), None)
        inactive_corp = next((r for r in output_rows if "Inactive" in r["Company"]), None)
        off_offer = next((r for r in output_rows if "Off" in r["Company"]), None)
        me_llc = next((r for r in output_rows if "Me" in r["Company"]), None)
        
        checks["status_normalization_bugs"] = {
            "wont_status": test_gmbh["Status"] if test_gmbh else None,
            "inactive_status": inactive_corp["Status"] if inactive_corp else None,
            "off_status": off_offer["Status"] if off_offer else None,
            "me_status": me_llc["Status"] if me_llc else None,
            "wont_is_won": test_gmbh["Status"] == "Zamknięty / Aktywny" if test_gmbh else False,
            "inactive_is_won": inactive_corp["Status"] == "Zamknięty / Aktywny" if inactive_corp else False,
            "off_is_negotiation": off_offer["Status"] == "Negocjacja" if off_offer else False,
            "me_is_negotiation": me_llc["Status"] == "Negocjacja" if me_llc else False
        }
        
        results["verification_checks"] = checks
        
    # 7. Save verification log
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
    print("Verification completed. Results written to verification_log.json.")

if __name__ == "__main__":
    run_verification()
