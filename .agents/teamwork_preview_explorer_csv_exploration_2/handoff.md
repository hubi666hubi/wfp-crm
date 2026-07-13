# Handoff Report: Leads Data Ingestion & Standardization Recommendations

## 1. Observation
We observed the following related to lead schemas, validation, and processing in the project workspace:

1. **Email Validation and Standardization**:
   - In `c:\Users\brend\Desktop\XX2\server\validation.ts` (lines 27-29), email validation is basic:
     ```typescript
     function isValidEmail(value: string): boolean {
       return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
     }
     ```
   - In the same file (line 56), the email is cleaned using: `email.trim().toLowerCase()`.
   - In `c:\Users\brend\Desktop\XX2\server\validation.test.ts` (lines 18-29), there are unit tests validating correct and incorrect email patterns.

2. **Lead Interfaces & Properties**:
   - In `c:\Users\brend\Desktop\XX2\src\components\facebook\types.ts`, `FBLead` is defined with the following key attributes:
     - `status: string` (Kanban stages: `'Do kontaktu'`, `'Wysłano PM / Komentarz'`, `'Odpowiedział'`, `'Negocjacja'`, `'Zamknięty / Aktywny'`)
     - `detectedCompanyUrl?: string`
     - `qualificationScore?: number`
   - In `c:\Users\brend\Desktop\XX2\server\inboundService.ts`, `InboundLead` is defined with the following attributes:
     - `status: string` (Values: `'Inbound (Wtyczka)'`, `'Zakwalifikowane'`, `'Wysłana wiadomość'`, `'Rozmowa w toku'`, `'Zamknięte / Sukces'`)
     - `score: number`
     - `bio: string`

3. **Existing Script-based CSV Handling**:
   - In `c:\Users\brend\Desktop\XX2\process_wfp_payload.py` (lines 195-217), incoming JSON payloads are flattened and exported to `wfp_leads.csv` and `wfp_leads.xlsx` with columns like `Evidence URL` and `Company/Persona`.

---

## 2. Logic Chain
Based on these observations, the following logical steps lead to the proposed standards:

- **Email & URL Validation**: The current email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` allows syntactically invalid strings (e.g., missing top-level domains of length 2+, trailing special chars). A standard regex is required to catch invalid emails early. Similarly, URL handling must accommodate both raw hostnames (e.g., `company.com`) and full URLs (e.g., `https://company.com/page`) using native constructors or standardized patterns.
- **Company Casing**: Inconsistent capitalization (e.g., `my company llc`, `MY COMPANY LLC`, `My Company, Llc`) reduces database clean-ness. A ruleset must Title Case standard words, handle legal suffixes (like `LLC` or `Sp. z o.o.`), and preserve inner camel-casing (e.g., `HubSpot`).
- **Lead Status Mapping**: Since multiple sources (Facebook, Inbound Plugin, CSV imports) use divergent status terms (e.g., `"in_progress"`, `"contacted"`, `"new"`), they must be mapped to the standardized CRM stages:
  1. `Do kontaktu` / `Inbound (Wtyczka)`
  2. `Wysłano PM / Komentarz` / `Wysłana wiadomość`
  3. `Odpowiedział` / `Rozmowa w toku`
  4. `Negocjacja`
  5. `Zamknięty / Aktywny` / `Zamknięte / Sukces`
- **Qualification Score Mapping**: Columns like `qualificationScore`, `score`, or `qualification_score` contain varied types (decimal floats like `0.85`, strings like `"High"`, or empty values). Normalization must scale these into a `0` to `100` integer range and provide a robust default (like `75` used by the UI).

---

## 3. Recommendations & Specifications

### A. Email and URL Validation Rules
#### 1. Email Validation
- **Regex**: Use the RFC 5322-compliant standard regex for standard validation:
  ```regex
  ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
  ```
- **Validation Logic**:
  - Trim leading and trailing whitespace.
  - Convert the string to lowercase.
  - Verify it matches the regex.
  - Return validation failure if empty or invalid.

#### 2. URL Validation & Standardization
- **Validation Logic**: Rather than a complex regex, use a fallback parser method. Check if the string forms a valid URL once prefixed with `https://` if a scheme is missing.
- **TypeScript Example**:
  ```typescript
  export function standardizeAndValidateUrl(urlStr: string): { isValid: boolean; url: string } {
    const trimmed = urlStr.trim();
    if (!trimmed) return { isValid: false, url: '' };

    // Prepend protocol if missing
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const targetUrl = hasProtocol ? trimmed : `https://${trimmed}`;

    try {
      const parsed = new URL(targetUrl);
      // Validate host has at least one dot (excluding local environments like localhost)
      const hostname = parsed.hostname;
      if (!hostname.includes('.') && hostname !== 'localhost') {
        return { isValid: false, url: '' };
      }
      return { isValid: true, url: parsed.href };
    } catch {
      return { isValid: false, url: '' };
    }
  }
  ```
- **Python Example**:
  ```python
  from urllib.parse import urlparse

  def standardize_and_validate_url(url_str: str):
      trimmed = url_str.strip()
      if not trimmed:
          return False, ""
      
      target_url = trimmed if trimmed.lower().startswith(("http://", "https://")) else f"https://{trimmed}"
      try:
          result = urlparse(target_url)
          is_valid = all([result.scheme, result.netloc]) and "." in result.netloc
          return is_valid, target_url if is_valid else ""
      except Exception:
          return False, ""
  ```

---

### B. Company Name Casing Standards
To format company names consistently:
1. **Trim Whitespace**: Remove leading/trailing spaces and replace multiple internal spaces with a single space.
2. **Title Case**: Capitalize the first letter of each word.
3. **Ignore Small Words (Stop Words)**: Keep words like `and`, `or`, `of`, `in`, `for`, `the`, `with` lowercase, unless they start the name.
4. **Standardize Suffixes**: Map legal suffixes to their canonical forms:
   - `llc` / `Llc` -> `LLC`
   - `ltd` / `Ltd` -> `LTD`
   - `inc` / `Inc` -> `Inc.`
   - `sp z oo` / `sp. z o.o.` -> `Sp. z o.o.`
   - `s.a.` / `sa` -> `S.A.`
   - `gmbh` / `Gmbh` -> `GmbH`
5. **Preserve Internal Casing**: If a word contains an uppercase letter in the middle (e.g. `HubSpot`, `ScaleFlow`, `SaaSFlow`), preserve its original casing.
6. **TypeScript Casing Logic**:
  ```typescript
  const STOP_WORDS = new Set(['and', 'or', 'of', 'in', 'for', 'the', 'with', 'a', 'an']);
  const SUFFIX_MAP: Record<string, string> = {
    'llc': 'LLC',
    'ltd': 'LTD',
    'inc': 'Inc.',
    'sa': 'S.A.',
    's.a.': 'S.A.',
    'gmbh': 'GmbH',
    'sp.zo.o.': 'Sp. z o.o.',
    'sp.zoo': 'Sp. z o.o.',
    'sp. z o.o.': 'Sp. z o.o.'
  };

  export function cleanCompanyName(name: string): string {
    let cleaned = name.trim().replace(/\s+/g, ' ');
    if (!cleaned) return '';

    const words = cleaned.split(' ');
    const formattedWords = words.map((word, idx) => {
      const lowerWord = word.toLowerCase().replace(/[^a-z.]/g, '');
      
      // Handle known suffixes
      if (SUFFIX_MAP[lowerWord]) {
        return SUFFIX_MAP[lowerWord];
      }

      // Preserve existing internal camel casing (e.g., HubSpot)
      const hasInternalCap = /[a-z]+[A-Z]+/.test(word);
      if (hasInternalCap) {
        return word;
      }

      // Handle stop words (except for the first word)
      if (idx > 0 && STOP_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      // Title Case: Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return formattedWords.join(' ');
  }
  ```

---

### C. Lead Status Standardization & Mapping
Map arbitrary input status names from CSVs/external sources into the 5 CRM pipelines stages:

| Input Stage Family | Incoming Examples / Synonyms | Target FBLead Status | Target InboundLead Status |
| :--- | :--- | :--- | :--- |
| **Stage 1: New / Inbox** | `"new"`, `"inbox"`, `"draft"`, `"raw"`, `"to_contact"` | `"Do kontaktu"` | `"Inbound (Wtyczka)"` |
| **Stage 2: Contacted** | `"contacted"`, `"sent"`, `"outreach"`, `"pm_sent"`, `"email_sent"`, `"message_sent"` | `"Wysłano PM / Komentarz"` | `"Wysłana wiadomość"` |
| **Stage 3: Responded** | `"replied"`, `"responded"`, `"engaged"`, `"in_progress"`, `"chatting"`, `"discussion"` | `"Odpowiedział"` | `"Rozmowa w toku"` |
| **Stage 4: In Negotiation** | `"negotiation"`, `"offer"`, `"meeting"`, `"demo"` | `"Negocjacja"` | `"Rozmowa w toku"` (or `"Zakwalifikowane"`) |
| **Stage 5: Won / Active** | `"won"`, `"active"`, `"closed_won"`, `"success"`, `"deal"`, `"client"` | `"Zamknięty / Aktywny"` | `"Zamknięte / Sukces"` |

#### Mapping function (TypeScript):
```typescript
export function mapLeadStatus(rawStatus: string, context: 'FB' | 'Inbound'): string {
  const normalized = rawStatus.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  const fbMap: Record<string, string> = {
    'new': 'Do kontaktu', 'inbox': 'Do kontaktu', 'draft': 'Do kontaktu', 'raw': 'Do kontaktu', 'to_contact': 'Do kontaktu',
    'contacted': 'Wysłano PM / Komentarz', 'sent': 'Wysłano PM / Komentarz', 'outreach': 'Wysłano PM / Komentarz', 'pm_sent': 'Wysłano PM / Komentarz',
    'replied': 'Odpowiedział', 'responded': 'Odpowiedział', 'engaged': 'Odpowiedział', 'in_progress': 'Odpowiedział',
    'negotiation': 'Negocjacja', 'offer': 'Negocjacja', 'meeting': 'Negocjacja', 'demo': 'Negocjacja',
    'won': 'Zamknięty / Aktywny', 'active': 'Zamknięty / Aktywny', 'closed_won': 'Zamknięty / Aktywny', 'success': 'Zamknięty / Aktywny'
  };

  const inboundMap: Record<string, string> = {
    'new': 'Inbound (Wtyczka)', 'inbox': 'Inbound (Wtyczka)', 'draft': 'Inbound (Wtyczka)', 'to_contact': 'Inbound (Wtyczka)',
    'contacted': 'Wysłana wiadomość', 'sent': 'Wysłana wiadomość', 'pm_sent': 'Wysłana wiadomość',
    'replied': 'Rozmowa w toku', 'responded': 'Rozmowa w toku', 'in_progress': 'Rozmowa w toku',
    'negotiation': 'Zakwalifikowane', 'demo': 'Zakwalifikowane',
    'won': 'Zamknięte / Sukces', 'success': 'Zamknięte / Sukces', 'closed_won': 'Zamknięte / Sukces'
  };

  const map = context === 'FB' ? fbMap : inboundMap;
  return map[normalized] || (context === 'FB' ? 'Do kontaktu' : 'Inbound (Wtyczka)');
}
```

---

### D. Qualification Score Integration
The incoming score can reside in columns: `qualificationScore`, `qualification_score`, `score`, or `lead_score`.

1. **Resolution Priority**: Look up properties in this order:
   - `qualificationScore` -> `qualification_score` -> `score` -> `lead_score` -> `priorityScore`.
2. **Value Scaling & Normalization**:
   - If value is a string matching categories (e.g. `"High"`, `"Gorący"`), convert to default score:
     - `"High" / "Gorący"` -> `90`
     - `"Medium" / "Ciepły"` -> `65`
     - `"Low" / "Zimny"` -> `30`
   - If value is a float in range `[0.0, 1.0]`, multiply by `100` and round.
   - If value is an integer in range `[0, 100]`, parse it directly.
   - Ensure the output integer is clamped: `Math.max(0, Math.min(100, parsedValue))`.
3. **Null/Empty Value Handling**:
   - Fallback to standard baseline score of `75` (consistent with the default UI fallback `lead.qualificationScore || 75`).

---

## 4. Caveats
- No direct database fields for `CLOSED_LOST` (Utracony) exist on the frontend, meaning rejected leads are deleted from database rather than kept as "Lost". Standard status mapping maps negative statuses to the first pipeline step or deletes them unless a custom Stage 6 is added.
- Subdomain handling in URLs might filter out some invalid/broken URLs but keep custom schemes.

---

## 5. Verification Method
To verify that validation and normalization works:
1. Verify the current unit tests pass:
   ```bash
   node --import tsx --test server/validation.test.ts
   ```
2. Verify the project's build and TypeScript compilation do not contain syntax errors:
   ```bash
   npm run build
   ```
