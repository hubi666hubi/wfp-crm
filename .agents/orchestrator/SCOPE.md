# Scope: CSV Lead Processing Module

## Architecture
- Standalone Python module (`csv_processor.py`) using `pandas` and `numpy`.
- Processes raw `wfp_leads.csv` input, outputting `wfp_leads_clean.csv` and `wfp_leads_report.json`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration | Locating wfp_leads.csv, verifying packages, and defining data rules | None | DONE |
| 2 | Implementation | Writing csv_processor.py and unit tests | M1 | DONE |
| 3 | Verification & Audit | Running tests, verifying outputs, and forensic audit | M2 | DONE |

## Data Mapping & Validation Contracts
- **Email Validation**: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- **URL Standardization**: Prepend `https://` if missing. Validate hostname structure.
- **Company Casing**: Clean whitespace, Title Case, preserve internal caps, map legal suffixes (LLC, Ltd., Sp. z o.o., etc.).
- **Status Normalization**: Map arbitrary inputs to one of the 5 CRM pipeline stages.
- **Score Normalization**: Scale floats (0-1) to 0-100, default empty/null to 75, parse strings like "High" -> 90.
