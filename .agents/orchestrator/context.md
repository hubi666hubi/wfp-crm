# Context — WFP CRM CSV Lead Processing Module

## Project Overview
The goal is to develop and implement a highly optimized module to clean, validate, standardize, and statistically analyze a lead database from `wfp_leads.csv`.

## Input Files
- `wfp_leads.csv` (Lead database containing raw leads data)

## Expected Outputs
- `wfp_leads_clean.csv` (Cleaned, validated, de-duplicated, and formatted leads)
- `wfp_leads_report.json` (Statistical analytics report of the leads database)

## Technical Requirements
- **Data Cleaning**: Remove duplicates based on company name or email, keeping the record with the higher qualification score (`qualificationScore` or `score`). Trim trailing/leading whitespace and remove empty rows.
- **Validation & Formatting**: Validate emails and URLs. Standardize text columns (company name casing, status formats).
- **Reporting**: Report average lead value, distribution of priorities (LOW/MEDIUM/HIGH), success rate of sources, and detail found/fixed errors.
