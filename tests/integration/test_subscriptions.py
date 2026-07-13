import sys
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

# Adjust path to import backend app
sys.path.append(os.path.join(os.path.dirname(__file__), "../../backend/app"))

from main import app

client = TestClient(app)

@pytest.fixture
def mock_stripe_checkout():
    with patch("stripe.checkout.Session.create") as mock_create:
        # Define mock session response
        mock_session = MagicMock()
        mock_session.id = "cs_test_mock_12345"
        mock_session.url = "https://checkout.stripe.com/pay/cs_test_mock_12345"
        mock_create.return_value = mock_session
        yield mock_create

def test_checkout_endpoint_success(mock_stripe_checkout):
    payload = {
        "price_id": "price_pro_tier_yearly",
        "email": "user@example.com",
        "annual_billing": True
    }
    
    response = client.post("/api/subscriptions/checkout", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["session_id"] == "cs_test_mock_12345"
    assert data["checkout_url"] == "https://checkout.stripe.com/pay/cs_test_mock_12345"
    
    # Verify metadata sent to Stripe matches specification
    mock_stripe_checkout.assert_called_once()
    kwargs = mock_stripe_checkout.call_args[1]
    assert kwargs["metadata"]["tier"] == "pro"
    assert kwargs["metadata"]["annual_discount"] == "true"
    assert kwargs["subscription_data"]["trial_period_days"] == 14

def test_checkout_endpoint_valid_referral(mock_stripe_checkout):
    payload = {
        "price_id": "price_basic_tier_monthly",
        "email": "referred_user@example.com",
        "referral_code": "valid_ref"
    }
    
    response = client.post("/api/subscriptions/checkout", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify referrer_id was mapped correctly from referral_code
    kwargs = mock_stripe_checkout.call_args[1]
    assert kwargs["metadata"]["referred_by"] == "referrer-uuid-1234"
    assert kwargs["metadata"]["tier"] == "basic"

def test_checkout_endpoint_invalid_referral(mock_stripe_checkout):
    payload = {
        "price_id": "price_basic_tier_monthly",
        "email": "user@example.com",
        "referral_code": "invalid_ref"
    }
    
    response = client.post("/api/subscriptions/checkout", json=payload)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "INVALID_REFERRAL_CODE"
    mock_stripe_checkout.assert_not_called()

def test_checkout_endpoint_invalid_email(mock_stripe_checkout):
    payload = {
        "price_id": "price_basic_tier_monthly",
        "email": "not-an-email"
    }
    
    response = client.post("/api/subscriptions/checkout", json=payload)
    
    assert response.status_code == 422
    mock_stripe_checkout.assert_not_called()
