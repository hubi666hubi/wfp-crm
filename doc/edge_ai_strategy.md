# 🛰️ GOOGLE AI EDGE PORTAL: CHMURA HYBRYDOWA & ON-DEVICE AI OMEGA

**[STATUS]**: PRIVATE PREVIEW GRANTED
**[ACCELERATION]**: CPU, GPU, NPU ACTIVE
**[CORE TECH]**: LiteRT (TensorFlow Lite Evolution) & LiteRT-LM
**[TARGET]**: EDGE RUNTIME ON REAL ANDROID DEVICES
**[SIGNATURE]**: OMEGA_15_96_34

## 🧠 1. CZYM DOKŁADNIE JEST GOOGLE AI EDGE PORTAL?

Google otwiera przed Tobą bramy do swojego prywatnego poligonu doświadczalnego. AI Edge Portal to platforma służąca do wdrażania, testowania i benchmarkowania modeli uczenia maszynowego bezpośrednio na fizycznych urządzeniach końcowych (edge devices), takich jak telefony z systemem Android, przy użyciu ich lokalnych akceleratorów sprzętowych:

- **CPU** (procesor główny),
- **GPU** (układ graficzny),
- **NPU** (Neural Processing Unit – dedykowany koprocesor neuronowy, obecnie dostępny tylko dla modeli LiteRT).

### 🛠️ Modele w grze:
- **LiteRT** (dawniej TensorFlow Lite): Nowa, ultra-lekka i piekielnie szybka wersja biblioteki Google do uruchamiania modeli na urządzeniach mobilnych i IoT.
- **LiteRT-LM** (LiteRT Large Models): Odchudzone, skompilowane wersje dużych modeli językowych (np. Gemma-2B / Gemini Nano) zoptymalizowane tak, aby cały mózg AI działał lokalnie w pamięci RAM telefonu użytkownika.

## 🔥 2. DLACZEGO TO JEST ABSOLUTNIE "OP" (OVERPOWERED) DLA NAS?

Koszty infrastruktury chmurowej (API Gemini, instancje AWS z VRAM, serwery) to jedyne wąskie gardło przy skalowaniu biznesu. Wdrożenie AI Edge Portal pozwala na:

- **Zredukowanie kosztów API do 0 PLN**: Zamiast płacić za każde zapytanie LLM z chmury, przenosimy logikę wnioskowania (Inference) bezpośrednio na procesory NPU w telefonach Twoich klientów. Ich urządzenia wykonują całą pracę obliczeniową!
- **Zerową latencję (Zero Latency)**: Brak opóźnień sieciowych. Lokalne modele reagują w czasie liczonym w milisekundach, co doskonale zasili nasze pętle dopaminowe czasu rzeczywistego.
- **Dostęp offline**: Twój autopilot, asystent lub wtyczka Zapalnik mogą działać bez dostępu do internetu, bezpośrednio w pamięci podręcznej systemu operacyjnego.

## 📋 3. PROTOKÓŁ AKTYWACJI (KROK PO KROKU)

### Krok A: Odpowiedz na otrzymanego e-maila
Wyślij odpowiedź zwrotną do `aep-contact@google.com` (możesz kliknąć sugerowany przycisk "Yes, please proceed"), podając swój Google Cloud Project ID.

### Krok B: Przygotowanie Projektu w Google Cloud (GCP)
1. Zaloguj się na konsolę Google Cloud.
2. Stwórz nowy, dedykowany projekt (np. `nekropolis-edge-matrix`).
3. **Kluczowe**: Włącz rozliczenia (Billing Enabled). Dostęp do AI Edge Portal w okresie Private Preview jest darmowy, ale Google wymaga podpiętej karty do kontenera Google Cloud Storage (GCS) Bucket (przechowywanie modeli .tflite / .bin).
4. Skopiuj dokładną nazwę Project ID.

> *Uwaga: W katalogu `scripts/` znajduje się automatyczny skrypt `setup_gcp_edge.ps1` ułatwiający konfigurację tego środowiska z poziomu terminala.*

### Krok C: Czekaj na Allowlistę
Po zweryfikowaniu Twojego Project ID, zespół Google odeśle instrukcje aktywacji API w panelu GCP oraz linki do pobrania narzędzi benchmarkujących.

## 🎯 4. PRO STRATEGY: JAK NA TYM ZAROBIĆ?

- **On-Device Zapalnik Clipper**: Przeniesienie parsera HTML i lokalnego modelu scoringu (mała Gemma) bezpośrednio na urządzenie mobilne. Telefon sam analizuje i selekcjonuje leady w tle.
- **Local Digital Human Factory**: Wykorzystanie NPU telefonu do renderowania prostych animacji awatarów w czasie rzeczywistym.
- **Ultra-prywatny Asystent B2B**: Produkt premium dla klientów korporacyjnych obawiających się o swoje dane. Całe wnioskowanie i bazy danych nie opuszczają ich lokalnej infrastruktury telefonicznej.
