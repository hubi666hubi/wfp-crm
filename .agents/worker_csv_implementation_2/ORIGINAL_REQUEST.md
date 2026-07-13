## 2026-07-09T12:55:34Z
<USER_REQUEST>
You are the WFP CRM CSV Module Worker (Attempt 2). Your working directory is c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation_2.
Your goal is to develop and implement a highly optimized module to clean, validate, standardize, and statistically analyze a lead database from `wfp_leads.csv`, outputting `wfp_leads_clean.csv` and `wfp_leads_report.json`.

Please follow these detailed specifications:
1. Develop the module in `c:\Users\brend\Desktop\XX2\csv_processor.py`.
2. Develop a test suite in `c:\Users\brend\Desktop\XX2\test_csv_processor.py` using Python's standard `unittest` library to test all functionality.
3. Use the Python virtual environment at `c:\Users\brend\Desktop\XX2\.venv` and run commands via `c:\Users\brend\Desktop\XX2\.venv\Scripts\python.exe`.
4. Ensure the clean CSV file keeps all original columns intact (no columns lost, same order) but values are cleaned/standardized.

Data Ingestion and Cleaning Logic:
- Trim whitespace on all text columns. Remove completely empty rows.
- Deduplicate records based on `Company` (or `Company/Persona`) and `Email`. A record is a duplicate if another record exists with the same company name (trimmed, case-insensitive) OR same email (trimmed, case-insensitive).
- Keep the record with the higher qualification score. Resolve the score column name dynamically checking: `qualificationScore` -> `qualification_score` -> `score` -> `lead_score` -> `priorityScore` -> `Est Value (USD)` -> `estimated_clv_usd` -> `value`.
- Scale float score values in the range [0.0, 1.0] to [0, 100] (multiply by 100 and round).
- Parse string score categories: "High" / "Gorący" -> 90, "Medium" / "Ciepły" -> 65, "Low" / "Zimny" -> 30.
- Parse numeric integer scores in [0, 100] directly.
- Clamp final score to [0, 100]. Default empty/missing scores to 75.

Validation & Formatting Rules:
- Email: Validated via `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` standard regex. If invalid, clear it or keep it as empty/invalid and track it as an error.
- URL: Prepend `https://` if missing. Validate that host exists and contains a dot (excluding `localhost`). If invalid, clear it and track it as an error.
- Company Name Casing: Clean extra spaces. Title Case words (except stop words like and, or, of, in, for, the, with, unless first word). Preserve internal camelCasing (e.g. HubSpot, ScaleFlow). Standardize legal suffixes: `llc`/`Llc` -> `LLC`, `ltd`/`Ltd` -> `LTD`, `inc`/`Inc` -> `Inc.`, `sp z oo`/`sp. z o.o.` -> `Sp. z o.o.`, `sa`/`s.a.` -> `S.A.`, `gmbh`/`Gmbh` -> `GmbH`.
- Status Normalization: Map raw input statuses to CRM pipeline stages. Standardize to either FB CRM stage ('Do kontaktu', 'Wysłano PM / Komentarz', 'Odpowiedział', 'Negocjacja', 'Zamknięty / Aktywny') or Inbound CRM stage ('Inbound (Wtyczka)', 'Wysłana wiadomość', 'Rozmowa w toku', 'Zakwalifikowane', 'Zamknięte / Sukces') based on Stage families:
  - New: "new", "inbox", "draft", "raw", "to_contact"
  - Contacted: "contacted", "sent", "outreach", "pm_sent", "email_sent", "message_sent"
  - Responded: "replied", "responded", "engaged", "in_progress", "chatting", "discussion"
  - Negotiation: "negotiation", "offer", "meeting", "demo"
  - Won: "won", "active", "closed_won", "success", "deal", "client"
  (Default to standard first stage if unmatched).

Statistical Report (wfp_leads_report.json):
- Generate a JSON file containing:
  - `average_lead_value`: Average of value column (checking `Est Value (USD)`, `value`, `estimated_clv_usd`, `estimatedValueHex`, etc., defaulting to 0).
  - `priority_distribution`: count of leads with priority "LOW" (score < 40), "MEDIUM" (score 40-79), "HIGH" (score >= 80).
  - `source_efficiency`: For each source (from `source`, `utm_source`, etc. column), calculate the success rate (percentage of leads mapping to Won/Active family). If no Won/Active leads are found, default success rate to 0.0 or average qualification score.
  - `errors_summary`: Counts of: `duplicates_removed`, `invalid_emails_cleaned`, `invalid_urls_cleaned`, `missing_scores_filled`, `casing_standardized`.

Liveness & Verification:
- Run the unit tests via `c:\Users\brend\Desktop\XX2\.venv\Scripts\python.exe test_csv_processor.py` and ensure they pass.
- Create a sample `wfp_leads.csv` to run your script and verify that `wfp_leads_clean.csv` and `wfp_leads_report.json` are created successfully.
- DO NOT use emojis in stdout/stderr to avoid Windows terminal encoding errors.
- MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.
Write a handoff report at c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation_2\handoff.md when done.
</USER_REQUEST>
