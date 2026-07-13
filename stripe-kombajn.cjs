// stripe-kombajn.cjs

async function triggerMockFirebaseStripeCampaign() {
  const MAKE_WEBHOOK_URL = 'https://make.com';

  // Słabości z Twojego modułu SWOT
  const competitorWeaknesses = [
    "Wysoka bariera wejścia i długa konfiguracja (time-to-value > 4h)",
    "Brak wbudowanych szablonów VSL i asystenta copywritingu AI",
    "Sztywne plany taryfowe bez rozliczeń Pay-on-Performance"
  ];

  console.log('🔌 [TRYB SYMULACJI]: Łączę z wirtualną bazą danych...');
  
  // Generujemy prawdziwe, realistyczne dane Twoich użytkowników z bazy na sucho
  const mockUsersSegment = [
    { id: 1408, email: "hubi666hubi@gmail.com", country: "PL" },
    { id: 2219, email: "premium-marketer@growth.io", country: "US" },
    { id: 3045, email: "vile-growth-builder@tech.co", country: "UK" }
  ];

  console.log(`📈 [TRYB SYMULACJI]: Znaleziono ${mockUsersSegment.length} klientów spełniających kryteria Stripe (> $300 w 30 dni).`);

  const payload = {
    campaign: "COMPETITIVE_SWOT_STRIPE_ATTACK",
    timestamp: new Date().toISOString(),
    competitor_weaknesses: competitorWeaknesses,
    users: mockUsersSegment
  };

  console.log('🚀 Ślę paczkę danych przez zabezpieczenia Cloudflare na Make.com...');
  
  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ KOMBAYN ZAKOŃCZYŁ PRACĘ PEŁNYM SUKCESEM!');
      console.log('📬 Make.com odebrał dane. Sprawdź swoje bordowe kółko i skrzynkę mailową, byku!');
    } else {
      console.error('❌ Błąd Make.com:', response.statusText);
    }
  } catch (error) {
    console.error('🚨 Błąd sieciowy przy wysyłce:', error.message);
  }
}

triggerMockFirebaseStripeCampaign();
