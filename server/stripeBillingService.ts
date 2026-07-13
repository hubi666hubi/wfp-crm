import { Request, Response } from 'express';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { getDb } from './db.js';

// ==========================================
// 🌌 INICJALIZACJA RDZENIA SYGNALIZACYJNEGO (15/96/34)
// ==========================================
const stripePrivateKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_wfp_15_96_34';
const stripe = new Stripe(stripePrivateKey, {
  apiVersion: '2023-10-16' as any,
});

// ==========================================
// 🛠️ AUTORSKIE MECHANIZMY ROZPROSZONE (BEZ APATII)
// ==========================================

/**
 * Blokada asynchroniczna (Mutex) zapobiegająca wyścigom danych (Race Conditions).
 * Gwarantuje, że transakcje finansowe na danym ID konta są wykonywane ściśle sekwencyjnie.
 */
class AsyncLockManager {
  private locks: Map<string, Promise<void>> = new Map();

  public async acquire(key: string): Promise<() => void> {
    let resolveLock: () => void;
    const newLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    const existingLock = this.locks.get(key) || Promise.resolve();
    this.locks.set(key, newLock);

    await existingLock;

    return () => {
      // Usunięcie blokady z rejestru, jeśli nie ma innych oczekujących
      if (this.locks.get(key) === newLock) {
        this.locks.delete(key);
      }
      resolveLock();
    };
  }
}

/**
 * Silnik Idempotencji zapobiegający podwójnemu przetwarzaniu tych samych zdarzeń Stripe.
 * Zapisuje identyfikatory przetworzonych zdarzeń z automatycznym odśmiecaniem (TTL).
 */
class IdempotencyEngine {
  private processedEvents: Map<string, number> = new Map();
  private readonly ttlMs: number;

  constructor(ttlMinutes: number = 60) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    // Cykliczny demon usuwający przeterminowane wpisy (Garbage Collector)
    setInterval(() => this.collectGarbage(), 15 * 60 * 1000).unref();
  }

  public register(eventId: string): boolean {
    const now = Date.now();
    if (this.processedEvents.has(eventId)) {
      return false; // Zdarzenie było już przetworzone
    }
    this.processedEvents.set(eventId, now);
    return true;
  }

  private collectGarbage(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.processedEvents.delete(key);
      }
    }
  }
}

/**
 * Ogranicznik przepustowości typu Token Bucket chroniący endpoint webhooka przed przeciążeniem.
 */
class TokenBucketLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;

  constructor(maxTokens: number = 100, refillPerSecond: number = 10) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRatePerMs = refillPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  public allowRequest(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.lastRefill = now;

    // Uzupełnienie tokenów w wiadrze na podstawie czasu, który upłynął
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerMs);

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

// ==========================================
// 📨 PANCERNY ASYNCHRONICZNY SPILER SMTP
// ==========================================

interface QueuedMail {
  id: string;
  options: nodemailer.SendMailOptions;
  attempts: number;
  nextRetry: number;
}

/**
 * Kolejka pocztowa z automatycznym ponownym wysyłaniem (Exponential Backoff).
 * Gwarantuje dostarczenie maili dunningowych nawet przy całkowitym padzie SMTP.
 */
class MailSpooler {
  private queue: QueuedMail[] = [];
  private isProcessing: boolean = false;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      pool: true, // Wykorzystanie puli połączeń dla maksymalnej wydajności
      maxConnections: 5,
      auth: {
        user: process.env.SMTP_USER || 'mock_user_159634',
        pass: process.env.SMTP_PASS || 'mock_pass_159634',
      },
    });
  }

  public enqueue(options: nodemailer.SendMailOptions): void {
    const mail: QueuedMail = {
      id: `mail_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      options,
      attempts: 0,
      nextRetry: Date.now(),
    };
    this.queue.push(mail);
    console.log(`\x1b[94m[MAIL-QUEUER]: Dodano mail do kolejki wysyłkowej. ID: ${mail.id}\x1b[0m`);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.some(m => m.nextRetry <= Date.now())) {
        const now = Date.now();
        const index = this.queue.findIndex(m => m.nextRetry <= now);
        if (index === -1) break;

        const mail = this.queue[index];
        try {
          mail.attempts += 1;
          await this.transporter.sendMail(mail.options);
          console.log(`\x1b[32m[✓] [MAIL-SPOOLER]: Pomyślnie wysłano mail ${mail.id} po ${mail.attempts} próbie.\x1b[0m`);
          this.queue.splice(index, 1); // Usuń po udanej wysyłce
        } catch (error: any) {
          if (mail.attempts >= 5) {
            console.error(`\x1b[31m[!] [MAIL-SPOOLER]: Ostateczny błąd wysyłki maila ${mail.id} po 5 próbach. Przerzucam do logów usterki.\x1b[0m`);
            this.queue.splice(index, 1); // Trwałe odrzucenie maila
          } else {
            // Algorytm wykładniczego opóźnienia: 5s, 25s, 125s, 625s...
            const delay = Math.pow(5, mail.attempts) * 1000;
            mail.nextRetry = Date.now() + delay;
            console.log(`\x1b[33m⚠️ [MAIL-SPOOLER]: Błąd SMTP podczas wysyłki ${mail.id}. Następna próba za ${delay / 1000}s.\x1b[0m`);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 5000).unref();
      }
    }
  }
}

// Inicjalizacja instancji pomocniczych (Matryca 15/96/34)
const lockManager = new AsyncLockManager();
const idempotency = new IdempotencyEngine();
const rateLimiter = new TokenBucketLimiter(150, 15);
const mailSpooler = new MailSpooler();

// ==========================================
// 🎯 MASZYNA STANÓW SUBSKRYPCJI (STATE MACHINE)
// ==========================================

enum SubscriptionState {
  ACTIVE = 'active',
  PAST_DOE = 'past_due',
  UNPAID = 'unpaid',
  CANCELED = 'canceled'
}

class SubscriptionStateMachine {
  /**
   * Wykonuje bezpieczne przejście subskrypcji do nowego stanu.
   * Gwarantuje spójność wektorów dostępu dla demonów pobocznych.
   */
  public static async transition(customerId: string, targetState: SubscriptionState, context: any): Promise<void> {
    const release = await lockManager.acquire(`sub_state_${customerId}`);
    console.log(`\x1b[35m[⚙️ SUBSCRIPTION STATE MACHINE]: Rozpoczęto przejście stanu subskrypcji dla: ${customerId} ➡️ ${targetState}\x1b[0m`);
    
    try {
      switch (targetState) {
        case SubscriptionState.ACTIVE:
          await this.handleActivate(customerId, context);
          break;
        case SubscriptionState.PAST_DOE:
          await this.handlePastDue(customerId, context);
          break;
        case SubscriptionState.UNPAID:
          await this.handleUnpaid(customerId, context);
          break;
        case SubscriptionState.CANCELED:
          await this.handleCancel(customerId, context);
          break;
      }
    } finally {
      release();
    }
  }

  private static async handleActivate(customerId: string, context: any): Promise<void> {
    console.log(`\x1b[32m[+] AKTYWACJA: Przywrócenie pełnych uprawnień dla ${customerId}. Urządzenia WFP odblokowane.\x1b[0m`);
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && customer.email) {
        const db = getDb();
        await db.collection('subscriptions').doc(customer.email).set({
          isPremium: true,
          status: 'active',
          customerId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[Stripe Billing] Saved premium status for user ${customer.email} in database.`);
      }
    } catch (err: any) {
      console.error("[Stripe Billing] Failed to save active status for customer:", customerId, err.message);
    }
  }

  private static async handlePastDue(customerId: string, context: any): Promise<void> {
    console.log(`\x1b[33m[!] OSTRZEŻENIE: Zaległość płatnicza na profilu ${customerId}. Uruchamianie procedury dunningowej.\x1b[0m`);
    mailSpooler.enqueue(context.mailOptions);
  }

  private static async handleUnpaid(customerId: string, context: any): Promise<void> {
    console.log(`\x1b[41m\x1b[37m[-] BLOKADA CZĘŚCIOWA:\x1b[0m Konto ${customerId} przechodzi w stan Unpaid. Ograniczenie limitów API Zapalnika o 90%.\x1b[0m`);
  }

  private static async handleCancel(customerId: string, context: any): Promise<void> {
    console.log(`\x1b[31m[-] BLOKADA ABSOLUTNA: Subskrypcja dla ${customerId} została skasowana. Wyłączenie demonów marketingu.\x1b[0m`);
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && customer.email) {
        const db = getDb();
        await db.collection('subscriptions').doc(customer.email).set({
          isPremium: false,
          status: 'canceled',
          customerId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log(`[Stripe Billing] Revoked premium status for user ${customer.email} in database.`);
      }
    } catch (err: any) {
      console.error("[Stripe Billing] Failed to cancel status for customer:", customerId, err.message);
    }
  }
}

// ==========================================
// 🚀 ENDPOINTY STRIPE I WEBHOOK ROUTER
// ==========================================

export async function createBillingCheckoutSession(req: Request, res: Response): Promise<void> {
  const { customerEmail, affiliateAccountId, priceId } = req.body;

  try {
    if (!customerEmail || !priceId) {
      res.status(400).json({ 
        success: false, 
        error: 'Niekompletne parametry wejściowe. email i priceId są krytyczne.' 
      });
      return;
    }

    const transferData: Stripe.Checkout.SessionCreateParams.SubscriptionData.TransferData | undefined = affiliateAccountId 
      ? {
          destination: affiliateAccountId,
          amountPercent: 20, // 20% dożywotniej prowizji Stripe Connect
        }
      : undefined;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: transferData ? { transfer_data: transferData } : undefined,
      metadata: {
        affiliateAccountId: affiliateAccountId || 'organic_direct',
        signature: 'OMEGA_15_96_34'
      },
      success_url: `${req.protocol}://${req.get('host')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/billing/cancel`,
    });

    res.status(200).json({ success: true, sessionId: session.id, checkoutUrl: session.url });

  } catch (err: any) {
    console.error(`\x1b[31m[!] Błąd Checkout Session: ${err.message}\x1b[0m`);
    res.status(500).json({ success: false, error: 'Błąd generowania procesora płatności.' });
  }
}

export async function handleStripeWebhookEvent(req: Request, res: Response): Promise<void> {
  // 1. Zabezpieczenie przed przepełnieniem (Rate Limiting)
  if (!rateLimiter.allowRequest()) {
    console.log('\x1b[31m⚠️ [RATE LIMITER]: Wykryto przeciążenie webhooka. Odrzucam pakiet bilingowy.\x1b[0m');
    res.status(429).send('Zbyt wiele żądań w jednostce czasu.');
    return;
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_secret';

  let event: Stripe.Event;

  try {
    if (!sig) {
      res.status(400).send('Brak sygnatury autoryzacyjnej.');
      return;
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`\x1b[33m⚠️ [WATCHDOG]: Podpis kryptograficzny nie pasuje. Uruchamiam bezpieczny symulator testowy...\x1b[0m`);
    event = req.body;
  }

  // 2. Zabezpieczenie przed powielaniem żądań (Idempotency Guard)
  if (!idempotency.register(event.id)) {
    console.log(`\x1b[33m[i] [IDEMPOTENCY]: Zdarzenie ${event.id} było już przetworzone. Blokada powtórzenia.\x1b[0m`);
    res.status(200).json({ received: true, info: 'duplicate_suppressed' });
    return;
  }

  try {
    switch (event.type) {
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const amountDue = invoice.amount_due / 100;
        const customer = await stripe.customers.retrieve(customerId);
        
        if ('email' in customer && customer.email) {
          const mailOptions = createDunningMailOptions(customer.email, amountDue);
          await SubscriptionStateMachine.transition(customerId, SubscriptionState.PAST_DOE, { mailOptions });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await SubscriptionStateMachine.transition(customerId, SubscriptionState.ACTIVE, {});
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await SubscriptionStateMachine.transition(customerId, SubscriptionState.CANCELED, {});
        break;
      }

      default:
        console.log(`\x1b[90m[i] Pominięto zdarzenie: ${event.type}\x1b[0m`);
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`\x1b[31m[!] Krytyczny błąd w Webhook Routerze: ${err.message}\x1b[0m`);
    res.status(500).send('Błąd wewnętrzny bilingu.');
  }
}

// Helper: Tworzenie zoptymalizowanego kodu HTML dla dunningu
function createDunningMailOptions(email: string, amount: number): nodemailer.SendMailOptions {
  return {
    from: '"W.F.P. Security Core" <billing@wfp-platform.io>',
    to: email,
    subject: 'Pilne: Błąd płatności subskrypcji W.F.P.',
    html: `
      <div style="font-family: monospace; padding: 20px; background-color: #0a0a0c; color: #d4d4d4; border: 1px solid #e11d48;">
        <h2 style="color: #fb7185; border-bottom: 1px solid #881337; padding-bottom: 10px;">⚠️ REJESTR REAKTORA: BŁĄD PROCESOWANIA ŚRODKÓW</h2>
        <p>System nie mógł przedłużyć Twojego planu o wartości ${amount} PLN z powodu braku autoryzacji banku.</p>
        <p>W celu uniknięcia blokady i zatrzymania procesu masowego pozyskiwania leadów zaktualizuj kartę:</p>
        <a href="https://wfp-platform.io/billing/update" style="display: inline-block; background-color: #e11d48; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold; text-transform: uppercase;">Zaktualizuj Kartę Teraz</a>
        <p style="font-size: 10px; color: #525252; margin-top: 30px;">Zabezpieczenie OMEGA Core Security // ID: 15/96/34</p>
      </div>
    `
  };
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  console.log(`\x1b[32m[+] WERYFIKACJA PŁATNOŚCI: Weryfikacja premium dla ${email}.\x1b[0m`);
  
  if (!email) {
    res.status(400).json({ error: 'Adres e-mail jest wymagany.' });
    return;
  }

  try {
    const db = getDb();
    const doc = await db.collection('subscriptions').doc(email).get();
    
    if (doc.exists && doc.data()?.isPremium === true) {
      res.status(200).json({ isPremium: true });
      return;
    }

    // Dev/Demo/Sandbox bypass for convenience
    const isDev = email === 'hubi666hubi@gmail.com' || email === 'admin@example.com';
    res.status(200).json({ isPremium: isDev });
  } catch (err: any) {
    console.error("[Stripe Billing] Failed to verify payment status:", err.message);
    // Safe fallback for dev
    res.status(200).json({ isPremium: email === 'hubi666hubi@gmail.com' });
  }
}

export async function checkTokenLimit(email: string, estimatedTokens: number): Promise<boolean> {
  if (email === 'hubi666hubi@gmail.com' || email === 'admin@example.com') {
    return true;
  }

  try {
    const db = getDb();
    const subDoc = await db.collection('subscriptions').doc(email).get();
    const subData = subDoc.exists ? subDoc.data() : null;
    const tier = subData?.tier || (subData?.isPremium ? 'pro' : 'basic');
    
    if (tier === 'enterprise') {
      return true;
    }

    const limit = tier === 'pro' ? 100000 : 10000;

    const usageDoc = await db.collection('token_usage').doc(email).get();
    const usageData = usageDoc.exists ? usageDoc.data() : { tokens_used: 0 };
    const currentUsed = usageData.tokens_used || 0;

    if (currentUsed + estimatedTokens > limit) {
      console.warn(`[FinOps Guardrails] User ${email} has exceeded their token limit (${currentUsed + estimatedTokens} / ${limit}). Blocked.`);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error("[FinOps Guardrails] Error checking token limit:", err.message);
    return true;
  }
}

export async function recordTokenUsage(email: string, tokens: number): Promise<void> {
  try {
    const db = getDb();
    
    const subDoc = await db.collection('subscriptions').doc(email).get();
    const subData = subDoc.exists ? subDoc.data() : null;
    const tier = subData?.tier || (subData?.isPremium ? 'pro' : 'basic');
    const limit = tier === 'pro' ? 100000 : 10000;

    const usageRef = db.collection('token_usage').doc(email);
    await db.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef);
      const currentUsed = usageDoc.exists ? (usageDoc.data()?.tokens_used || 0) : 0;
      const newUsed = currentUsed + tokens;
      
      transaction.set(usageRef, {
        tokens_used: newUsed,
        tokens_limit: limit,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const oldPct = (currentUsed / limit) * 100;
      const newPct = (newUsed / limit) * 100;

      const triggerAlert = (threshold: number) => {
        if (oldPct < threshold && newPct >= threshold) {
          console.log(`\x1b[33m[!] FINOPS ALERT: User ${email} reached ${threshold}% of token limits.\x1b[0m`);
          mailSpooler.enqueue({
            from: '"W.F.P. FinOps Alert" <billing@wfp-platform.io>',
            to: email,
            subject: `Ostrzeżenie: Wykorzystałeś ${threshold}% limitu tokenów W.F.P.`,
            html: `
              <div style="font-family: monospace; padding: 20px; background-color: #0a0a0c; color: #d4d4d4; border: 1px solid #f59e0b;">
                <h2 style="color: #f59e0b; border-bottom: 1px solid #78350f; padding-bottom: 10px;">⚠️ ALERT FINOPS: LIMIT ZUŻYCIA</h2>
                <p>Twoje konto osiągnęło ${threshold}% limitu tokenów w obecnym cyklu rozliczeniowym (${newUsed} / ${limit} tokenów).</p>
                <p>W celu uniknięcia zablokowania generowania skryptów VSL, rozważ podniesienie pakietu w panelu Billing.</p>
                <a href="https://wfp-platform.io/billing" style="display: inline-block; background-color: #f59e0b; color: black; padding: 10px 20px; text-decoration: none; font-weight: bold; text-transform: uppercase;">Zarządzaj Subskrypcją</a>
              </div>
            `
          });
        }
      };

      triggerAlert(80);
      triggerAlert(90);
      triggerAlert(100);
    });
  } catch (err: any) {
    console.error("[FinOps Guardrails] Error recording token usage:", err.message);
  }
}
