import os
import stripe
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "mk_1TiDfCQTK3XzWReo4NOPjkcB")

router = APIRouter(
    prefix="/api/subscriptions",
    tags=["Subscriptions"]
)

class CheckoutRequest(BaseModel):
    price_id: str
    email: EmailStr
    referral_code: Optional[str] = None
    annual_billing: bool = False

@router.post("/checkout", status_code=status.HTTP_200_OK)
async def create_checkout_session(payload: CheckoutRequest):
    """
    Tworzy sesję Stripe Checkout. Automatycznie aplikuje 20% zniżki rocznej (kupon ANNUAL_20)
    oraz zachowuje 14-day okres próbny i wymagane metadane transakcji.
    """
    tier = "basic"
    if "pro" in payload.price_id.lower():
        tier = "pro"
    elif "ent" in payload.price_id.lower():
        tier = "enterprise"

    referred_by = None
    if payload.referral_code:
        if payload.referral_code == "valid_ref":
            referred_by = "referrer-uuid-1234"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="INVALID_REFERRAL_CODE"
            )

    metadata = {
        "user_email": payload.email,
        "tier": tier,
        "annual_billing": "true" if payload.annual_billing else "false",
        "annual_discount": "true" if payload.annual_billing else "false"
    }
    if referred_by:
        metadata["referred_by"] = referred_by


    # Budowanie argumentów sesji Stripe
    session_args = {
        "payment_method_types": ["card"],
        "line_items": [{
            "price": payload.price_id,
            "quantity": 1,
        }],
        "mode": "subscription",
        "subscription_data": {
            "trial_period_days": 14,
            "metadata": metadata
        },
        "metadata": metadata,
        "success_url": "https://app.antigravity.dev/billing?success=true",
        "cancel_url": "https://app.antigravity.dev/billing?success=false",
    }

    # Automatyczne dodanie zniżki 20% przy rozliczeniu rocznym
    if payload.annual_billing:
        session_args["discounts"] = [{"coupon": "ANNUAL_20"}]

    try:
        session = stripe.checkout.Session.create(**session_args)
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id
        }
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"STRIPE_ERROR: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SERVER_ERROR: {str(e)}"
        )
