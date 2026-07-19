---
name: omega-core-integration-and-healing
description: >-
  Orchestrates the WFP CRM self-evolution loop, Python dependency virtual environment,
  and Firebase Data Connect compile/build cycles for production and development.
---

# Omega Core Integration and Healing

## Overview
This skill provides structured steps and checklists to compile, run, verify, and maintain the WFP CRM system, including the self-evolution Python pipeline (L2-L5), the background concurrency daemons (Omega Core), and the Firebase Data Connect relational GraphQL backend.

## Dependencies
- `managing-python-dependencies` (Global) — to activate `.venv` and install required Python packages (`pydantic`, `pandas`, `openpyxl`).
- `firebase-data-connect` (Local) — to compile the GraphQL schema and generate Node SDKs.

## Quick Start
To verify the entire environment and run the CRM:
1. Compile the Firebase Data Connect schema.
2. Build the production React frontend and Node backend.
3. Start the combined production server, which spawns the Python background worker automatically.

## Workflow

### 1. Python Environment Setup & Maintenance
Before running any Python-based script (such as `master_core.py` or `server/ignite_core.py`), ensure the virtual environment is healthy:
- Check if `.venv/` exists. If not, run `python -m venv .venv`.
- Install the pinned dependencies using `.venv\Scripts\pip install -r requirements.txt` (on Windows).
- Ensure all modules in `server/` use the dual-path import pattern so they can be run from the root directory or inside `server/`.

### 2. Firebase Data Connect Schema Validation
Validate the schema before committing changes or building:
- Run `npx -y firebase-tools@latest dataconnect:compile`.
- Verify that `dataconnect/schema/schema.gql` contains the correct types (`Campaign`, `CampaignConversion`, `Lead`, `Event`, `EvolutionLog`).
- Ensure mutations and queries compile successfully.

### 3. Production Build
Compile both the React client assets and the server bundle:
- Run `npm run build` (runs Vite build and bundles `server.ts` into `dist/server.cjs`).
- Check that the `dist/` directory contains `index.html` and `server.cjs`.

### 4. Running the System (Combined Concurrency)
- Run `npm run start` to start the Node.js server.
- The Node server automatically spawns `nco_pa_start.py` as a background process.
- Monitor console outputs for `[PYTHON CORE]` and `[PYTHON CORE ERROR]` logs.

## Common Mistakes
- **Running Python globally**: Always use the explicit `.venv\Scripts\python` path on Windows.
- **Emoji Encoding Crash**: Avoid printing raw emojis (like 🔥, ✅, ❌) to the stdout/stderr of Python processes on Windows systems, as they crash under cp1250 encoding. Use brackets like `[FIRE]` or `[PASSED]`.
- **Express Wildcard Routing**: Use `app.get(/.*/)` instead of `app.get('*')` to prevent route conflicts in Express 5.
