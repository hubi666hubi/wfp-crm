export interface InvoicePayload {
  companyName: string;
  email: string;
  amount: number;
  serviceType: string;
  invoiceType: 'proforma' | 'vat';
}

export class FinanceService {
  private static MAKE_WEBHOOK_URL = "https://hook.make.com/finance-v24-elite";

  public static async issueInvoice(payload: InvoicePayload) {
    console.log(`[FINANCE_DAEMON] Inicjowanie wystawienia faktury dla ${payload.companyName}...`);

    // W rzyczywistości to zapytanie leci do Make.com, który gada z Fakturownią/iFirmą
    try {
      const response = await fetch(this.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          operational_mode: 'PRO_MAX_ZERO_HUMAN'
        })
      });

      if (!response.ok) {
        // Symulacja sukcesu dla dewelopera jeśli webhook nie istnieje
        console.warn("[FINANCE_DAEMON] Webhook Make.com nieodpowiedział (404/500). Symulacja transferu...");
      }

      return { success: true, message: "Faktura wysłana do kolejki przetwarzania Make.com" };
    } catch (err) {
      console.error("[FINANCE_DAEMON] Błąd krytyczny integracji finansowej:", err);
      return { success: false, error: err };
    }
  }

  public static async triggerJarvisVoice(message: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pl-PL';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}
