## 2026-07-09T19:30:27Z
You are the WFP CRM CSV Module Worker (Attempt 4). Your working directory is c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation_4.
Your goal is to optimize and correct the duplicate deduplication logic in `c:\Users\brend\Desktop\XX2\csv_processor.py` to satisfy both unit test suites (`test_csv_processor.py` and `test_csv_processor_challenger.py`).

Detailed tasks:
1. Re-implement the graph connected-component deduplication in `c:\Users\brend\Desktop\XX2\csv_processor.py`, but optimize it using a Disjoint Set Union (DSU) / Union-Find data structure to run in O(N alpha(N)) time.
   - For DSU mapping:
     - Map each record (by its original index) to its parent.
     - Loop through records: if two records share the same company name (trimmed, lowercase, non-empty, and not in the generic company list `{"self-employed", "freelance", "none", "n/a", "unknown", "private", "individual"}`), union their parent representatives.
     - Similarly, if two records share the same email (trimmed, lowercase, non-empty), union their parent representatives.
     - After grouping records by their component representative parent index:
       - For each component, select the record to keep based on: highest score (integer 0-100), and on tie, the lowest original index.
       - Discard the rest of the records in the component.
     - At the end, sort the kept records by their original index to preserve stable row ordering in `wfp_leads_clean.csv`.
2. Run the challenger test suite using:
   `c:\Users\brend\Desktop\XX2\.venv\Scripts\python.exe test_csv_processor_challenger.py`
   And also run the original test suite:
   `c:\Users\brend\Desktop\XX2\.venv\Scripts\python.exe test_csv_processor.py`
3. Verify that both test suites pass successfully. If there are any other small bugs or value/statistics differences, fix them in `csv_processor.py` or the test files as necessary.
4. Regenerate the output files `wfp_leads_clean.csv` and `wfp_leads_report.json` based on the raw `wfp_leads.csv` input.
5. Write a handoff report at c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation_4\handoff.md when done. Include test results and verified output files content.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work.
Do not use emojis in console outputs to prevent Windows terminal encoding errors.
