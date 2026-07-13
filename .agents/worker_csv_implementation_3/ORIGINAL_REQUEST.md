## 2026-07-09T13:07:33Z

You are the WFP CRM CSV Module Worker (Attempt 3). Your working directory is c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation_3.
Your goal is to implement fixes for the bugs identified in the first round of reviews and verify the changes.

Bugs to fix in `c:\Users\brend\Desktop\XX2\csv_processor.py` and `c:\Users\brend\Desktop\XX2\test_csv_processor.py`:
1. **Deduplication algorithm**:
   - Replace the graph-based connected component logic in deduplication (it causes transitive over-deduplication, which incorrectly merges disjoint companies).
   - Use a single-pass O(N) loop over records (sorted by score descending):
     - Keep track of `seen_companies` and `seen_emails` sets.
     - Exclude empty/blank emails from duplicate check.
     - Exclude generic/placeholder company names: `{"self-employed", "freelance", "none", "n/a", "unknown", "private", "individual"}` (case-insensitive, trimmed) from duplicate checks.
     - A record is duplicate if `company in seen_companies` (for non-empty, non-generic company) OR `email in seen_emails` (for non-empty email).
     - Maintain original row stability (sort kept records by original index at the end).
2. **Currency/Value Parsing**:
   - Enable `skipinitialspace=True` in `csv.reader(f, skipinitialspace=True)` to prevent splitting columns on double-quoted fields with commas that have spaces before quotes (e.g. ` "$25,000"`).
   - Support European formats (e.g. `12.345,67 €` or `12345,67`), Polish formats (`12 345,67 zł`), and standard US formats (`12,345.67`), cleaning spaces and currency symbols correctly before parsing.
3. **Score Scaling & Float parsing**:
   - In `parse_score`, parse as float first. If the float value is in `(0.0, 1.0]`, multiply by 100 and round to integer (so both `"1"` and `"1.0"` scale to `100`). Otherwise, round float directly to integer. Clamp to `[0, 100]`.
   - Safely handle `OverflowError` and `ValueError` when checking large/infinite float values (e.g. `1.0e1000`), defaulting to `75`.
4. **Status Normalization**:
   - Add `"lost"`, `"closed_lost"`, `"closed-lost"`, `"refused"`, `"rejection"`, `"rejected"`, `"odrzucone"`, `"archiwum"`, `"archived"`, `"trash"` to a `'lost'` family in `STAGE_FAMILY_MAP`. Map `'lost'` family to `"Odrzucone"` for both FB and Inbound pipelines.
   - Refactor substring checks in `normalize_status` to prevent false positive matches on words (e.g. `"won't"` should not match `"won"`, `"off"` should not match `"offer"`). Check word matches or exact matches in sets.
5. **Casing & Branding**:
   - Keep lowercase-initiated camelCase brand names (e.g. `eBay`, `iPad`, `iPhone`) completely untouched in casing (do not capitalize the first letter).
   - Add Polish stop words to `STOP_WORDS` so they remain lowercase: `{"i", "z", "w", "o", "u", "na", "do", "dla", "pod", "nad", "przy", "oraz", "lub"}`.
6. **Suffix Cleanups**:
   - Collapse consecutive duplicate suffix words at the end of company names (e.g. `"LLC LLC"` -> `"LLC"`, `"LTD LTD"` -> `"LTD"`, `"Sp. z o.o. Sp. z o.o."` -> `"Sp. z o.o."`).
7. **Source Efficiency Stats**:
   - Calculate success rate purely as the percentage of leads mapping to the `'won'` family.
   - If a source has no won leads, the success rate is `0.0` (do NOT mix it with average score).

Liveness & Verification:
- Update `test_csv_processor.py` to cover these new cases and run `.venv\Scripts\python.exe test_csv_processor.py` to verify that all tests pass.
- Execute the script on raw `wfp_leads.csv` to regenerate corrected `wfp_leads_clean.csv` and `wfp_leads_report.json`.
- DO NOT use emojis in stdout/stderr to avoid Windows terminal encoding errors.
- MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.
Write a handoff report at c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation_3\handoff.md when done.
