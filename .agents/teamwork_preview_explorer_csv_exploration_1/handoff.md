# Handoff Report: WFP Leads CSV and Data Sources Exploration

## 1. Observation
I investigated the workspace directory `c:\Users\brend\Desktop\XX2` to search for `wfp_leads.csv` and explore potential leads data sources. Below are the direct observations:

* **File Search Results:**
  * Searching for `wfp_leads.csv` across all subdirectories returned **0 results**.
  * Searching for `wfp_leads.xlsx` across all subdirectories returned **0 results**.
  * Searching for any files containing `leads` in the name returned **0 results** in the project files (excluding dependency caches).
  * Searching for any `.csv` file in the workspace returned only test/validation data inside the Python virtual environment (`venv/Lib/site-packages/numpy/...`).
* **`process_wfp_payload.py` Ingestion and Output Logic:**
  * Line 220 defines: `output_csv = "wfp_leads.csv"`
  * Lines 223–244 handle the write-out logic:
    ```python
            try:
                if os.path.exists(output_xlsx):
                    existing_df = pd.read_excel(output_xlsx)
                    df = pd.concat([existing_df, df], ignore_index=True)
                df.to_excel(output_xlsx, index=False, engine='openpyxl')
                print(f"\n[SUKCES] Dane i gotowe MAILE dopisane do pliku Excel: {output_xlsx}")
                success = True
            except PermissionError:
                alt_xlsx = f"wfp_leads_alt_{int(pd.Timestamp.now().timestamp())}.xlsx"
                df.to_excel(alt_xlsx, index=False, engine='openpyxl')
                print(f"[SUKCES] Zapisano awaryjnie w: {alt_xlsx}")
                success = True
            except ImportError:
                pass
                
            if not success:
                if os.path.exists(output_csv):
                    existing_df = pd.read_csv(output_csv)
                    df = pd.concat([existing_df, df], ignore_index=True)
                df.to_csv(output_csv, index=False, encoding='utf-8-sig')
                print(f"[SUKCES] Dane i gotowe MAILE zrzucone do CSV: {output_csv}")
    ```
  * Input source details:
    * Line 163 attempts system clipboard retrieval: `clipboard_content = get_clipboard_text()`
    * Line 173 falls back to stdin paste: `print("\nWklej poniżej CAŁY tekst wypluty przez AI Studio...")`
    * Line 178 ends stdin ingestion when finding `"KONIEC"`.
* **Alternative Leads Data Sources:**
  * **Firebase Data Connect Schema:** `dataconnect/schema/schema.gql` defines a `Lead` table (`type Lead @table(name: "leads")`) on lines 29–87 containing fields such as `name`, `email`, `postText`, `authorName`, `groupName`, `estimatedValueHex`, and `valueFirstMessengerPitch`.
  * **Express Backend Mock Leads:** `server.ts` exposes a mock endpoint on line 119: `app.get('/api/leads', (_req, res) => res.json({ success: true, leads: localFBLeads }));` where `localFBLeads` contains a single stub lead (lines 50–52).
  * **SQLite Database:** `backend_schema.sql` defines schemas for `short_videos`, `short_video_details`, `digital_human_voices`, `digital_human_avatars`, `tasks`, and `fonts` but does not include any tables related to leads or outreach.

---

## 2. Logic Chain
1. **Absence of the CSV File:** Based on the exhaustive file search results, there is no file named `wfp_leads.csv` currently present anywhere in the workspace.
2. **Generation Process & Trigger Conditions:**
   * `process_wfp_payload.py` is designed to generate output when run with a JSON payload from AI Studio.
   * If `openpyxl` is installed, the script writes to `wfp_leads.xlsx` by default, setting `success = True`.
   * The script only writes to `wfp_leads.csv` if `success` remains `False` (which occurs when `openpyxl` is not installed, triggering `ImportError`, or if writing to excel fails due to other non-permission errors).
   * Therefore, we must run `process_wfp_payload.py` with an active clipboard payload or paste the payload manually to generate it.
3. **Payload Structure:** The script expects a JSON array list of objects containing fields like `wfp_vector_id`, `lead_intelligence` (nested payload), `technical_vulnerability`, `automated_outreach_payload`, and `financial_projection`.
4. **Alternative Source Mechanisms:**
   * Firebase Data Connect is the structured relational storage model for leads in this CRM application, as defined in `schema.gql`.
   * For local testing or fallback, the Express server in `server.ts` serves hardcoded stub data (`localFBLeads`) rather than reading from a local CSV.

---

## 3. Caveats
* The SQLite database file `data/app.db` was not directly inspected with a sqlite client because it is a binary file; however, its structure was inferred through `backend_schema.sql`.
* Running `process_wfp_payload.py` was not executed since the investigation is restricted to a read-only scope.

---

## 4. Conclusion
`wfp_leads.csv` is completely missing from the repository because it is a generated output, not a static file. 
* To generate it, `process_wfp_payload.py` must be executed.
* It expects a specific structured JSON payload representing customer profiles, which it parses from the system clipboard or from terminal input terminated with `"KONIEC"`.
* It writes to `wfp_leads.xlsx` by default and falls back to `wfp_leads.csv` only if `openpyxl` is missing or writing to Excel fails.
* The formal schema for persistent CRM leads is defined in Firebase Data Connect (`dataconnect/schema/schema.gql`), while the current express dev server serves mock leads via `server.ts`.

---

## 5. Verification Method
To verify these findings:
1. View `process_wfp_payload.py` lines 219–243 to inspect the conditional logic for Excel/CSV generation.
2. Check the GraphQL schemas in `dataconnect/schema/schema.gql` to confirm the structure of the `Lead` type.
