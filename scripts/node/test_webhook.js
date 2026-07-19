// test_webhook.js
// ==============================================================================
// WFP CRM SYSTEM ENGINE - STRIPE WEBHOOK PRODUCTION LIGHTNING TESTER
// ==============================================================================

const TARGET_URL = "http://localhost:5000/api/webhook";

const mockPayload = {
  id: "evt_1NcoWFP_Production_Matrix",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_a1b2c3",
      customer: "cus_MarekWFP",
      customer_details: {
        email: "hubi666hubi@gmail.com"
      },
      amount_total: 150000, // 1500.00 PLN
      currency: "pln",
      metadata: {
        clientId: "client_hubix",
        clientEmail: "hubi666hubi@gmail.com",
        referred_by: "partner_brend" // 20% prowizji dla partnera
      }
    }
  }
};

async function executeProductionTest() {
  console.log("🚀 [TEST LAUNCH]: Inicjowanie uderzenia w potok Stripe Webhook...");
  console.log(`🔗 Cel transakcji: ${TARGET_URL}`);
  
  try {
    const response = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1710000000,v1=mock_signature_integrity_value"
      },
      body: JSON.stringify(mockPayload)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log("\n🟢 [TEST PASSED]: Serwer odebrał ładunek bezbłędnie!");
      console.log(`📥 Kod odpowiedzi: ${response.status} OK`);
      console.log(`💬 Odpowiedź silnika: ${responseText}`);
      console.log("\n⚡ Potok Babilon przekierował zadanie do pamięci RAM/Redis. Sprawdź logi tradera w Pythonie pod kątem naliczenia 300.00 PLN prowizji!");
    } else {
      console.error(`\n❌ [TEST FAILED]: Serwer odrzucił połączenie. Status: ${response.status}`);
      console.error(`💬 Szczegóły odmowy: ${responseText}`);
    }
  } catch (error) {
    console.error("\n🚨 [CRITICAL NETWORK ERROR]: Nie można nawiązać połączenia z serwerem Express!");
    console.error(`Powód: ${error.message}`);
    console.error("👉 Upewnij się, że Twój serwer Express nasłuchuje na porcie 5000 przed uruchomieniem testu.");
  }
}

executeProductionTest();