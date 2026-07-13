# Original User Request

## Initial Request — 2026-07-07T07:48:31Z

Optymalizacja i refaktoryzacja wydajnościowa aplikacji WFP CRM (klient React + serwer Express) w celu wyeliminowania lagów, zbędnych re-renderów, wycieków pamięci oraz optymalizacji bundle'a.

Working directory: c:\Users\brend\Desktop\XX2
Integrity mode: benchmark

## Requirements

### R1. Refaktoryzacja i podział komponentów (React component extraction)
Wydzielenie mniejszych komponentów (np. widok Kanban, formularze, okienka modalne) z olbrzymich plików widoków (`src/pages/FacebookLeads.tsx`, `src/pages/VslGenerator.tsx`, `src/pages/Zapalnik.tsx`). Przeniesienie ich do dedykowanych katalogów w `src/components/`.

### R2. Optymalizacja renderowania i pamięci podręcznej React
* Wdrożenie `React.memo`, `useMemo` i `useCallback` w kluczowych miejscach renderowania, zwłaszcza w pętlach i listach.
* Usunięcie nieużywanych zmiennych stanowych (dead state), zoptymalizowanie stanów złożonych obiektów oraz scalenie powtarzających się struktur kodu (Zasada DRY).

### R3. Optymalizacja cyklu życia i zapytań API
* Poprawa obsługi efektów w `useEffect`: zapewnienie pełnej czyszczącej funkcji (cleanup functions) dla wszystkich subskrypcji, interwałów i timeoutów.
* Zabezpieczenie zapytań API przed wyścigami danych (race conditions) przy użyciu `AbortController`.
* Skorygowanie pętli odpytywania (polling) w celu unikania przeciążenia API.

### R4. Stabilizacja API i Rotacja Gemini
* Zapewnienie stabilności endpointu `/api/handle-aistudio-call` oraz innych połączeń z Gemini API.
* Poprawa obsługi błędów 429 i mechanizmów awaryjnych (fallback) na wypadek wyczerpania limitów klucza API.

## Acceptance Criteria

### Poprawność techniczna
- [ ] Komenda `npm run build` wykonuje się pomyślnie, budując zarówno frontend, jak i backend.
- [ ] Narzędzie TypeScript `npx tsc --noEmit` nie zgłasza żadnych błędów kompilacji w całym projekcie.

### Struktura kodu i optymalizacja
- [ ] Duże pliki stron (`Zapalnik.tsx`, `FacebookLeads.tsx`, `VslGenerator.tsx`) zostały rozbite na mniejsze podkomponenty w katalogu `src/components/`.
- [ ] Wszystkie subskrypcje, interwały i timery w zmodyfikowanych komponentach posiadają funkcje czyszczące w `useEffect`.
- [ ] Funkcje obsługi zdarzeń przekazywane do podkomponentów w pętlach `.map` są owinięte w `useCallback` lub zoptymalizowane pod kątem stabilności referencji.

### Weryfikacja działania API
- [ ] Endpoint `/api/handle-aistudio-call` zwraca poprawną strukturę odpowiedzi z bazy wiedzy Supabase i nie rzuca błędów 500 ani 404 przy prawidłowych zapytaniach.

## Follow-up — 2026-07-08T22:02:28+02:00

Zaprojektowanie i wdrożenie relacyjnej bazy danych Firebase SQL Connect (PostgreSQL) dla systemu CRM, obsługującej zaawansowane relacje między leadami, zdarzeniami (np. ZAPALNIK_CLIP), kampaniami marketingowymi oraz historią samoewolucji kodu.

Working directory: c:\Users\brend\Desktop\XX2
Integrity mode: development

## Requirements

### R1. Konfiguracja usługi Firebase SQL Connect
* Utworzenie i wdrożenie kompletnej struktury katalogu `dataconnect/` w katalogu roboczym.
* Konfiguracja `dataconnect/dataconnect.yaml` oraz `dataconnect/connector/connector.yaml` z SDK skierowanym na generowanie kodu TypeScript do katalogu `server/dataconnect/`.

### R2. Projektowanie Relacyjnego Modelu Danych (schema/schema.gql)
* Zaprojektowanie modelu danych w `dataconnect/schema/schema.gql` za pomocą natywnego GraphQL z użyciem dyrektyw `@table`.
* Model musi uwzględniać elastyczne relacje między leadami (Lead), zdarzeniami systemowymi (Event) oraz logami samoewolucji kodu (EvolutionLog).

### R3. Definiowanie Operacji Zapytań i Mutacji (Queries & Mutations)
* Utworzenie zapytań w `dataconnect/connector/queries.gql` do odpytywania leadów z filtrowaniem i sortowaniem.
* Utworzenie mutacji w `dataconnect/connector/mutations.gql` do bezpiecznego wstawiania i aktualizowania danych przy użyciu operacji typu `_upsert`.

### R4. Walidacja i Generowanie SDK za pomocą Firebase CLI
* Uruchomienie narzędzi kompilacji i weryfikacji w celu statycznego sprawdzenia poprawności schematu oraz wygenerowania kodu SDK.

## Acceptance Criteria

### Kompilacja i Generowanie SDK
- [ ] Narzędzie `npx -y firebase-tools@latest dataconnect:compile` wykonuje się pomyślnie i nie zgłasza żadnych błędów składni GraphQL lub typów.
- [ ] Pliki SDK JavaScript/TypeScript są pomyślnie wygenerowane w folderze server/dataconnect/.

### Poprawność Struktury Plików
- [ ] Plik dataconnect.yaml istnieje i zawiera poprawny serviceId oraz datasource SQL.
- [ ] Plik schema.gql zawiera zdefiniowane typy z dyrektywą @table.
- [ ] Pliki queries.gql i mutations.gql zawierają prawidłowo sformatowane operacje GraphQL.

## 2026-07-08T22:06:07Z

Pełna integracja i ekstremalna optymalizacja systemu WFP CRM. Połączenie wszystkich rozwijanych modułów (klient React, serwer Express, Omega Core, Firebase SQL Connect) w jeden w pełni zautomatyzowany, samoleczący się ekosystem.
System zostanie wprowadzony w tryb pełnej pracy (środowisko produkcyjne).

Working directory: c:\Users\brend\Desktop\XX2
Integrity mode: benchmark

### Requirements

#### R1. Wdrożenie Trybu Produkcyjnego (Production Mode)
Uruchomienie serwera aplikacji w rygorystycznym trybie produkcyjnym. Konfiguracja zmiennych środowiskowych `NODE_ENV=production`, zapewnienie serwowania skompilowanych bundli frontendu zamiast serwera proxy (Vite Dev Server), oraz optymalizacja ukrywania nadmiarowych logów deweloperskich.

#### R2. Architektura i Pełna Integracja (Full Integration)
Połączenie skryptów rdzenia samoleczącego Pythona z serwerem Node.js w taki sposób, aby koegzystowały i nie blokowały głównego wątku (Event Loop). Dokładna forma integracji (np. child_process lub wywoływanie poprzez kolejki) pozostawiona jest ekspertyzie agentów. System musi komunikować się stabilnie z bazą Firebase Data Connect (PostgreSQL).

#### R3. Ekstremalna Optymalizacja (Super Optimization)
Zabezpieczenie przed wyciekami pamięci, ostateczna optymalizacja komponentów React w głównych widokach (eliminacja re-renderów) oraz optymalizacja kodu po stronie serwera Express, tak by wytrzymał masowy ruch demonów.

### Acceptance Criteria

#### Weryfikacja Produkcji
- [ ] Komenda `npm run build` kompiluje aplikację frontendową i backendową bez zgłaszania błędów (zero błędów TypeScript w trybie `--noEmit`).
- [ ] Komenda `npm run start` (uruchamiająca skompilowany plik `server.cjs` Node.js) uruchamia całą architekturę i serwuje poprawnie frontend dla klienta w przeglądarce pod `http://localhost:<PORT>`.

#### Integracja i Stabilność
- [ ] Zmiany nie psują dotychczasowych definicji i wdrożeń schematów w Firebase Data Connect. Baza i GraphQL działają stabilnie.
- [ ] Testy asynchronicznego ruchu (oraz demonów Pythona) działają współbieżnie z żądaniami do Express API, nie powodując zatorów czasowych.

## 2026-07-09T12:34:28Z

# Teamwork Project Prompt

Opracowanie i zaimplementowanie wysoce zoptymalizowanego modułu do czyszczenia, walidacji, standaryzacji oraz analizy statystycznej bazy leadów w pliku CSV (`wfp_leads.csv`). Zespół agentów ma całkowitą swobodę w doborze technologii i metodologii realizacji.

Working directory: c:\Users\brend\Desktop\XX2
Integrity mode: benchmark

## Requirements

### R1. Czyszczenie i De-duplikacja (Data Cleaning)
Wczytanie pliku `wfp_leads.csv`, usunięcie duplikatów (rekordów o tej samej nazwie firmy lub e-mailu), przy zachowaniu wariantu o wyższej ocenie (qualificationScore / score). Usunięcie pustych wierszy i zbędnych spacji (whitespace trimming).

### R2. Walidacja i Formatowanie (Validation & Formatting)
Sprawdzenie poprawności adresów e-mail oraz linków (URL). Standaryzacja kolumn tekstowych (np. wielkości liter w nazwach firm, formatowanie statusów).

### R3. Raportowanie Statystyczne (Analytics Report)
Wygenerowanie pliku podsumowującego `wfp_leads_report.json` zawierającego średnią wartość leadów, rozkład priorytetów (LOW/MEDIUM/HIGH), skuteczność poszczególnych źródeł (source) oraz podsumowanie znalezionych i naprawionych błędów.

## Acceptance Criteria

### Poprawność Operacji
- [ ] Struktura kolumn pliku wynikowego `wfp_leads_clean.csv` jest w pełni zgodna ze strukturą wejściową (brak utraty danych kolumnowych).

## 2026-07-09T19:27:45Z

The server restarted and your execution was paused. I ran the test suites and found that test_csv_processor_challenger.py is failing with several errors in deduplication, average lead value calculations, priority distribution, and error summaries.



## 2026-07-09T20:24:41Z

# Teamwork Project Prompt

Opracowanie, wdrożenie i pełna weryfikacja modułu subskrypcji Stripe w technologii FastAPI, zabezpieczonego automatycznym audytem statycznym (SecOps) oraz powiązanego z kampanią marketingową w frameworku PAS.

Working directory: c:\Users\brend\Desktop\XX2
Integrity mode: benchmark

## Requirements

### R1. Implementacja Subskrypcji Stripe (Stripe Subscriptions API)
Utworzenie endpointu `POST /api/subscriptions/checkout` w pliku `backend/app/routers/subscriptions.py` generującego sesję płatniczą Stripe dla wybranego price_id (obsługa planów Basic, Pro, Enterprise, z uwzględnieniem 14-dniowego okresu próbnego i 20% zniżki przy płatności rocznej).

### R2. Testy Integracyjne (Integration Testing via TestClient)
Napisanie zestawu testów integracyjnych w pliku `tests/integration/test_subscriptions.py` weryfikujących bezpośrednio endpointy FastAPI (przy użyciu `fastapi.testclient.TestClient`) z mockowaniem biblioteki `stripe` (poprawność generowania sesji, kody polecające, błędy PaymentError/SubscriptionError).

### R3. Audyt Bezpieczeństwa Trzeciego Oka (Static Analysis SecOps)
Stworzenie skryptu audytorskiego `skills/SkillMonetizationAudit/third_eye_audit.py` dokonującego statycznej analizy kodu `subscriptions.py` pod kątem luk bezpieczeństwa (SQL injection, brak weryfikacji sygnatur webhooków, brak obsługi wyjątków Stripe) oraz limitów budżetu tokenów. Wybór technologii (np. moduł AST lub parsowanie regex) leży w gestii zespołu.

### R4. Lejek Marketingowy PAS (Growth Hacking Copy)
Przygotowanie kompletnego tekstu na landing page oraz założeń kampanii viralowej w pliku `specs/marketing_funnel.md` opartego na frameworku PAS (Problem-Agitate-Solve) dostosowanego do nowej funkcji subskrypcji.

## Acceptance Criteria

### Poprawność Operacji i Weryfikacja
- [ ] Program wykonuje się bez błędów w terminalu, a wszystkie testy integracyjne w `test_subscriptions.py` przechodzą pomyślnie.
- [ ] Skrypt `third_eye_audit.py` poprawnie skanuje pliki i potwierdza brak naruszeń SecOps.
- [ ] Pliki `subscriptions.py`, `test_subscriptions.py`, `third_eye_audit.py` oraz `marketing_funnel.md` zostają pomyślnie utworzone i zintegrowane.
