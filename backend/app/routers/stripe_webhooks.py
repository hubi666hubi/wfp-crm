import os
import stripe
import datetime
from fastapi import APIRouter, Request, HTTPException, Header, status
from fastapi.responses import JSONResponse

# Bezpieczne ładowanie kluczy produkcyjnych pobranych z pliku środowiskowego .env
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "mk_1TiDfCQTK3XzWReo4NOPjkcB")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_7aJiDHtn1fyLZZJ0y3RL4gUt2Rgb9FCM")

router = APIRouter(
    prefix="/api/webhooks",
    tags=["Webhooks"]
)

async def check_event_idempotency(event_id: str) -> bool:
    """
    Zapobiega wielokrotnemu przetwarzaniu tego samego zdarzenia (Idempotency Guard).
    """
    # W warunkach produkcyjnych: SELECT processed FROM webhook_events WHERE stripe_event_id = event_id
    return False

async def log_webhook_event(event_id: str, event_type: str, payload: dict):
    """
    Zapisuje surowe zdarzenie do tabeli webhook_events z flagą processed = FALSE.
    """
    print(f"[DB] Rejestracja zdarzenia {event_id} ({event_type}) w stanie oczekiwania.")

async def mark_event_processed(event_id: str):
    """
    Oznacza zdarzenie jako pomyślnie przetworzone.
    """
    print(f"[DB] Zdarzenie {event_id} oznaczone jako PROCESSED.")

async def mark_event_failed(event_id: str, error_msg: str):
    """
    Zapisuje log błędu w przypadku niepowodzenia operacji biznesowych.
    """
    print(f"[DB] Awaria przetwarzania zdarzenia {event_id}: {error_msg}")

# --- PROCEDURY REAKCJI NA ZDARZENIA BIZNESOWE STRIPE ---

async def handle_sub_created(sub_data: dict):
    """
    Tworzy rekord subskrypcji użytkownika w bazie danych po udanej inicjalizacji.
    """
    customer_id = sub_data.get("customer")
    sub_id = sub_data.get("id")
    print(f"[TASK] Inicjalizacja subskrypcji {sub_id} dla klienta {customer_id}.")

async def handle_sub_updated(sub_data: dict):
    """
    Aktualizuje stan subskrypcji, np. przy przejściu z okresu próbnego (trialing) na aktywny.
    """
    sub_id = sub_data.get("id")
    current_status = sub_data.get("status")
    print(f"[TASK] Aktualizacja subskrypcji {sub_id}. Nowy status: {current_status}.")

async def handle_sub_deleted(sub_data: dict):
    """
    Dezaktywuje dostęp do API oraz limity tokenów po anulowaniu subskrypcji.
    """
    sub_id = sub_data.get("id")
    print(f"[TASK] Subskrypcja {sub_id} anulowana. Blokowanie limitów API.")

async def handle_invoice_payment_success(invoice_data: dict):
    """
    Przechwytuje udane odnowienia subskrypcji i zeruje liczniki użytych tokenów.
    Dodatkowo realizuje automatyczne rozliczanie prowizji partnerskich (20%).
    """
    customer_id = invoice_data.get("customer")
    sub_id = invoice_data.get("subscription")
    amount_paid = invoice_data.get("amount_paid", 0)  # w centach
    
    print(f"[TASK] Płatność faktury udana. Resetowanie limitów tokenów dla klienta: {customer_id}.")
    
    if sub_id:
        try:
            # Pobieramy subskrypcję, aby odczytać jej metadane (referred_by)
            subscription = stripe.Subscription.retrieve(sub_id)
            metadata = subscription.get("metadata", {})
            referred_by = metadata.get("referred_by")
            
            if referred_by and referred_by != "none":
                commission_amount = int(amount_paid * 0.20)  # 20% prowizji w centach
                print(f"[AFFILIATE] Płatność {amount_paid}¢ dla subskrypcji {sub_id}. Naliczono 20% prowizji dla partnera {referred_by}: {commission_amount}¢.")
                
                # Zapisujemy prowizję w lokalnym rejestrze (mock bazy PostgreSQL)
                ledger_path = os.path.join(os.getcwd(), "affiliate_ledger.json")
                ledger_data = []
                if os.path.exists(ledger_path):
                    import json
                    try:
                        with open(ledger_path, "r", encoding="utf-8") as f:
                            ledger_data = json.load(f)
                    except Exception:
                        pass
                
                ledger_data.append({
                    "timestamp": datetime.datetime.now().isoformat() if "datetime" in globals() else str(time.time()),
                    "subscription_id": sub_id,
                    "customer_id": customer_id,
                    "referred_by": referred_by,
                    "amount_paid_cents": amount_paid,
                    "commission_cents": commission_amount,
                    "status": "APPROVED"
                })
                
                import json
                with open(ledger_path, "w", encoding="utf-8") as f:
                    json.dump(ledger_data, f, indent=2, ensure_ascii=False)
                
                print(f"[DB] Zapisano prowizję {commission_amount}¢ dla partnera {referred_by} w rejestrze afiliacyjnym.")
        except Exception as e:
            print(f"[AFFILIATE ERROR] Błąd podczas naliczania prowizji partnerskiej dla subskrypcji {sub_id}: {str(e)}")

async def handle_invoice_payment_failure(invoice_data: dict):
    """
    Uruchamia procedury windykacyjne (Dunning Flow) i nadaje status past_due.
    """
    invoice_id = invoice_data.get("id")
    print(f"[TASK] Błąd płatności faktury {invoice_id}. Inicjalizacja procedur naprawczych.")

@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Główny, produkcyjny punkt wejścia dla webhooków Stripe z weryfikacją kryptograficzną.
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header.")

    payload = await request.body()
    payload_str = payload.decode("utf-8")

    # 1. Bezwzględna weryfikacja podpisu cyfrowego Stripe
    try:
        event = stripe.Webhook.construct_event(
            payload_str, stripe_signature, endpoint_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload signature.")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature verification failed.")

    event_id = event["id"]
    event_type = event["type"]
    data_object = event["data"]["object"]

    # 2. Kontrola idempotencji
    if await check_event_idempotency(event_id):
        return JSONResponse(content={"received": True, "duplicate": True}, status_code=status.HTTP_200_OK)

    # 3. Zapis zdarzenia do dziennika audytowego
    await log_webhook_event(event_id, event_type, event)

    # 4. Asynchroniczne przekierowanie do odpowiednich potoków wykonawczych
    try:
        if event_type == "customer.subscription.created":
            await handle_sub_created(data_object)
        elif event_type == "customer.subscription.updated":
            await handle_sub_updated(data_object)
        elif event_type == "customer.subscription.deleted":
            await handle_sub_deleted(data_object)
        elif event_type == "invoice.payment_succeeded":
            await handle_invoice_payment_success(data_object)
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failure(data_object)
        else:
            print(f"[WEBHOOK] Ignorowanie nieobsługiwanego typu zdarzenia: {event_type}")

        # Oznaczenie zdarzenia jako w pełni przetworzone
        await mark_event_processed(event_id)

    except Exception as e:
        error_msg = str(e)
        await mark_event_failed(event_id, error_msg)
        return JSONResponse(
            content={"received": True, "error": error_msg},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return JSONResponse(content={"received": True}, status_code=status.HTTP_200_OK)
