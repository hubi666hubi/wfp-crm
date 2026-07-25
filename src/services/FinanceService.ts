export class FinanceService {
  /**
   * Syntetyzuje głos powiadamiający o zamknięciu sprzedaży (Zero-Human-Accounting)
   * Używa dostępnego polskiego/angielskiego głosu.
   */
  public triggerJarvisVoice(amount: number): void {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    const text = `Revenue Event Confirmed: ${amount} PLN`;
    const utterance = new SpeechSynthesisUtterance(text);

    // Próbujemy dobrać fajny głos
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Szukamy angielskiego głosu, np. Google UK English Male/Female dla vibe'u Jarvisa
      const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Great Britain') || v.name.includes('Daniel')) || voices[0];
      utterance.voice = jarvisVoice;
    }

    utterance.pitch = 0.8;
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
    console.log(`[FinanceService] 🎙️ Jarvis synth triggered: "${text}"`);
  }

  /**
   * Automatycznie wypycha Webhook do Make.com z danymi leada do wystawienia faktury Fakturownia / iFirma (Stripe Elite Webhook Engine)
   */
  public async triggerStripeWebhook(leadName: string, makeWebhookUrl: string, amount: number): Promise<boolean> {
    if (!makeWebhookUrl) {
      console.warn("[FinanceService] Brak Make.com Webhook URL, pomijam automatyczne fakturowanie.");
      return false;
    }

    try {
      const payload = {
        event: "ZAMKNIECIE_SUKCES",
        leadName,
        amountPLN: amount,
        timestamp: new Date().toISOString(),
        description: "Zero-Human-Accounting Triggered from CRM"
      };

      const response = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`[FinanceService] 💸 Make.com Webhook pomyślnie uderzony dla leada: ${leadName}`);
        return true;
      } else {
        console.error(`[FinanceService] ❌ Błąd uderzenia webhooka: ${response.status}`);
        return false;
      }
    } catch (err) {
      console.error("[FinanceService] ❌ Błąd sieci podczas wywoływania webhooka:", err);
      return false;
    }
  }
}

export const financeService = new FinanceService();
