import os
import sys
import stripe
from fastapi import FastAPI, Request, HTTPException

# Wymuszenie kodowania UTF-8 dla konsoli Windows, aby uniknąć UnicodeEncodeError z emoji
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

app = FastAPI(title="OMEGA Stripe Webhooks")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "dummy_key")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_dummy")

stripe.api_key = STRIPE_SECRET_KEY

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe Signature")

    try:
        # Weryfikacja sygnatury zdarzenia ze Stripe
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        print(f"[WEBHOOK BŁĄD] Nieprawidłowy payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"[WEBHOOK BŁĄD] Nieprawidłowa sygnatura: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Odbieranie user_id przekazanego w metadata przy tworzeniu linku
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id', 'Unknown User')
        
        # Aktualizujesz bazę (np. Firestore): Użytkownik ma teraz dostęp
        print(f"\n[STRIPE WEBHOOK] 🤑 SUKCES! Użytkownik {user_id} opłacił dostęp!")
        print(f"Kwota: {session.get('amount_total', 0) / 100} USD")
        
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    print(">>> Uruchamianie lokalnego serwera webhooków Stripe na porcie 4242...")
    uvicorn.run(app, host="0.0.0.0", port=4242)
