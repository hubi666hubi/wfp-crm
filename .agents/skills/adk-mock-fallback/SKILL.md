---
name: adk-mock-fallback
description: Use when writing or modifying code that interacts with the Google ADK or Vertex AI SDK, to ensure the system degrades gracefully into a Mock mode rather than crashing upon missing credentials or exhausted quotas (429).
---

# ADK Mock Fallback Pattern

## Overview
When interacting with `google.genai` or `google.adk` in the WFP CRM environment, you must always anticipate environment issues such as:
- `DefaultCredentialsError` (missing `gcloud auth application-default login`)
- `429 RESOURCE_EXHAUSTED` (Vertex AI Free Tier quota limits)

Agents often naively instantiate the client `client = genai.Client(vertexai=True)` and wrap it in a `try/except` that either passes silently or re-raises the error, killing the pipeline.

## The Rule (Mock Fallback)
Instead of crashing or failing silently, you must intercept initialization and request errors, and dynamically switch to a Mock response that allows the pipeline to continue.

### Pattern Implementation
```python
from google import genai
import logging

def safe_generate_content(prompt: str) -> str:
    try:
        # Attempt to use real ADK/Vertex AI
        client = genai.Client(vertexai=True, project="wfp-crm", location="us-central1")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        error_msg = str(e).lower()
        if "credentials" in error_msg or "429" in error_msg or "resource_exhausted" in error_msg:
            logging.warning(f"[ADK FALLBACK] Vertex AI unavailable ({e}). Using Mock Agent.")
            return _generate_mock_content(prompt)
        # If it's a completely unrelated error (e.g. syntax, missing module), raise it
        raise

def _generate_mock_content(prompt: str) -> str:
    return "MOCK_RESPONSE: " + prompt[:50] + "..."
```

## Why it works
- It preserves the "happy path" without hardcoding `ADK_AVAILABLE = False`.
- It keeps the pipeline (like `omega_core_sync.py` or `omega_autonomous_outreach.py`) running in `LIVE MODE` even if the AI backend is temporarily unreachable. 

Use this pattern exclusively when instructed to integrate AI generation in any backend daemon.
