import json
import re
import os
import pandas as pd

def get_clipboard_text():
    """
    Retrieves text from the Windows clipboard natively using ctypes to prevent
    terminal rendering lag, line-truncation jitter, or encoding corruption.
    """
    try:
        # Standard library tkinter method (cross-platform fallback)
        import tkinter as tk
        root = tk.Tk()
        root.withdraw()
        text = root.clipboard_get()
        root.destroy()
        if text and isinstance(text, str):
            return text.strip()
    except Exception:
        pass

    try:
        # Native Windows ctypes method (bulletproof, zero dependencies, bypasses terminal buffer)
        import ctypes
        from ctypes import wintypes
        
        OpenClipboard = ctypes.windll.user32.OpenClipboard
        OpenClipboard.argtypes = [wintypes.HWND]
        OpenClipboard.restype = wintypes.BOOL
        
        GetClipboardData = ctypes.windll.user32.GetClipboardData
        GetClipboardData.argtypes = [wintypes.UINT]
        GetClipboardData.restype = wintypes.HANDLE
        
        CloseClipboard = ctypes.windll.user32.CloseClipboard
        CloseClipboard.argtypes = []
        CloseClipboard.restype = wintypes.BOOL
        
        CF_UNICODETEXT = 13
        
        GlobalLock = ctypes.windll.kernel32.GlobalLock
        GlobalLock.argtypes = [wintypes.HANDLE]
        GlobalLock.restype = ctypes.c_void_p
        
        GlobalUnlock = ctypes.windll.kernel32.GlobalUnlock
        GlobalUnlock.argtypes = [wintypes.HANDLE]
        GlobalUnlock.restype = wintypes.BOOL
        
        if OpenClipboard(None):
            h_clip_mem = GetClipboardData(CF_UNICODETEXT)
            if h_clip_mem:
                data_ptr = GlobalLock(h_clip_mem)
                if data_ptr:
                    text = ctypes.c_wchar_p(data_ptr).value
                    GlobalUnlock(h_clip_mem)
                    CloseClipboard()
                    if text:
                        return text.strip()
            CloseClipboard()
    except Exception:
        pass
    return None

def repair_json(text):
    """
    Repairs common LLM/AI Studio formatting anomalies like unescaped newlines, 
    smart quotes, single-quoted keys, and trailing commas.
    """
    # Replace smart quotes with straight ones
    text = text.replace('“', '"').replace('”', '"').replace('„', '"')
    text = text.replace('‘', "'").replace('’', "'")
    
    # Standardize single quotes around keys/values to double quotes
    text = re.sub(r"'\s*:", '":', text)
    text = re.sub(r":\s*'", ':"', text)
    text = re.sub(r"'\s*,", '",', text)
    text = re.sub(r",\s*'", ',"', text)
    text = re.sub(r"\[\s*'", '["', text)
    text = re.sub(r"'\s*\]", '"]', text)
    text = re.sub(r"\{\s*'", '{"', text)
    text = re.sub(r"'\s*\}", '"}', text)
    
    # Strip trailing commas inside arrays and objects
    text = re.sub(r',\s*([\]}])', r'\1', text)
    
    # Handle unescaped raw newlines inside double-quoted strings
    in_string = False
    escape_active = False
    repaired_chars = []
    
    for char in text:
        if char == '"' and not escape_active:
            in_string = not in_string
        
        if char == '\\' and in_string:
            escape_active = not escape_active
        else:
            escape_active = False
            
        if char == '\n' and in_string:
            repaired_chars.append('\\n')
        elif char == '\r' and in_string:
            continue
        else:
            repaired_chars.append(char)
            
    return "".join(repaired_chars)

def extract_json(text):
    """
    Extracts the JSON payload from the provided text using robust pattern matching
    and auto-repair capabilities.
    """
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try extracting markdown json code block
    json_block_pattern = re.compile(r'```(?:json)?\s*([\s\S]*?)\s*```', re.IGNORECASE)
    match = json_block_pattern.search(text)
    if match:
        extracted = match.group(1).strip()
    else:
        # Fallback: locate matching outer brackets or braces
        start_idx = -1
        for idx, char in enumerate(text):
            if char in ('[', '{'):
                start_idx = idx
                break
        
        end_idx = -1
        for idx in range(len(text) - 1, -1, -1):
            if text[idx] in (']', '}'):
                end_idx = idx
                break
                
        if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
            extracted = text[start_idx:end_idx+1]
        else:
            extracted = text.strip()

    # Try parsing extracted JSON block
    try:
        return json.loads(extracted)
    except json.JSONDecodeError:
        pass

    # Try parsing after auto-repairing formatting errors
    try:
        repaired = repair_json(extracted)
        return json.loads(repaired)
    except Exception as e:
        print(f"\n[DIAGNOSTYKA]: Nie udało się sparsować danych nawet po auto-naprawie. Szczegóły błędu: {e}")
        
    return None

def process_wfp_payload():
    print("=== WFP [WIRTUALNA FABRYKA PRODUKTÓW] - OUTREACH INGESTION CORE ===")
    
    full_text = ""
    clipboard_content = get_clipboard_text()
    
    if clipboard_content and ("WFP-" in clipboard_content or "[" in clipboard_content):
        print("\n[INFO] Wykryto dane w schowku systemowym.")
        choice = input("Czy chcesz automatycznie zaimportować dane ze schowka? (T/n): ").strip().lower()
        if choice in ('', 't', 'tak', 'y', 'yes'):
            full_text = clipboard_content
            print("[INFO] Wczytano dane bezpośrednio ze schowka.")
            
    if not full_text:
        print("\nWklej poniżej CAŁY tekst wypluty przez AI Studio...")
        lines = []
        while True:
            try:
                line = input()
                if line.strip() == "KONIEC":
                    break
                lines.append(line)
            except KeyboardInterrupt:
                return
            except EOFError:
                break
        full_text = "\n".join(lines)
        
    data = extract_json(full_text)
    
    if data:
        if not isinstance(data, list):
            print("\n[BŁĄD]: Dane JSON muszą być tablicą (Array).")
            return
            
        try:
            flattened_data = []
            for item in data:
                lead_intel = item.get("lead_intelligence") or {}
                tech_vuln = item.get("technical_vulnerability") or {}
                outreach_pay = item.get("automated_outreach_payload") or {}
                fin_proj = item.get("financial_projection") or {}
                
                # Zmapowane pod pełny moduł Outreach
                flat_item = {
                    "Vector ID": item.get("wfp_vector_id", ""),
                    "Company/Persona": lead_intel.get("company_or_persona") or item.get("ideal_customer_profile", ""),
                    "Evidence URL": lead_intel.get("exact_pain_point_source") or "",
                    "Outreach Hook": lead_intel.get("inbound_trigger_phrase") or "",
                    "Broken System": tech_vuln.get("broken_software_or_process") or "",
                    "WFP Solution Stack": tech_vuln.get("wfp_native_replacement_stack") or "",
                    "EMAIL SUBJECT": outreach_pay.get("email_subject") or "Quick question regarding your setup",
                    "EMAIL BODY": outreach_pay.get("email_body") or "",
                    "Pricing Tier": fin_proj.get("wfp_pricing_tier_recommended") or "Standard SaaS",
                    "Est Value (USD)": fin_proj.get("estimated_clv_usd") or 0,
                    "Days to Close": fin_proj.get("time_to_close_days_projection") or 0
                }
                flattened_data.append(flat_item)
            
            df = pd.DataFrame(flattened_data)
            output_xlsx = "wfp_leads.xlsx"
            output_csv = "wfp_leads.csv"
            success = False
            
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
                    
        except Exception as e:
            print(f"\n[BŁĄD PRZETWARZANIA STRUKTURY]: {e}")
    else:
        print("\n[BŁĄD]: Brak prawidłowego JSONa lub błąd dekodowania.")

if __name__ == "__main__":
    process_wfp_payload()
