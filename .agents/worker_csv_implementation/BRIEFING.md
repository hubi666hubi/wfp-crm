# BRIEFING — 2026-07-09T14:55:00+02:00

## Mission
Develop and implement a highly optimized module to clean, validate, standardize, and statistically analyze a lead database from `wfp_leads.csv`, outputting `wfp_leads_clean.csv` and `wfp_leads_report.json`.

## 🔒 My Identity
- Archetype: WFP CRM CSV Module Worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation
- Original parent: 36c687ea-3238-4cdc-967f-82559e8a99b0
- Milestone: CSV Module Implementation

## 🔒 Key Constraints
- Develop in `c:\Users\brend\Desktop\XX2\csv_processor.py`.
- Develop test suite in `c:\Users\brend\Desktop\XX2\test_csv_processor.py` using Python's standard `unittest` library.
- Use Python virtual environment at `c:\Users\brend\Desktop\XX2\.venv` and run via `c:\Users\brend\Desktop\XX2\.venv\Scripts\python.exe`.
- Ensure clean CSV keeps all original columns intact (no columns lost, same order).
- No emojis in stdout/stderr to avoid Windows terminal encoding errors.
- DO NOT CHEAT: genuine logic, real state and behavior, no hardcoded test results or dummy/facade implementations.
- Write handoff report at `c:\Users\brend\Desktop\XX2\.agents\worker_csv_implementation\handoff.md` when done.

## Current Parent
- Conversation ID: 36c687ea-3238-4cdc-967f-82559e8a99b0
- Updated: not yet

## Task Summary
- **What to build**: Python script `csv_processor.py` to ingest, deduplicate, score, validate, and standardize CSV lead data, write clean data to `wfp_leads_clean.csv`, and produce statistical metrics in `wfp_leads_report.json`.
- **Success criteria**: All cleaning, validation, and statistical rules implemented perfectly. All unit tests passing. No regressions.
- **Interface contracts**: Input `wfp_leads.csv`, outputs `wfp_leads_clean.csv` and `wfp_leads_report.json`.
- **Code layout**: Root folder of the project (`c:\Users\brend\Desktop\XX2`).

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]

## Change Tracker
- **Files modified**: None yet.
- **Build status**: TBD
- **Pending issues**: None

## Quality Status
- **Build/test result**: TBD
- **Lint status**: TBD
- **Tests added/modified**: None

## Loaded Skills
- None
