import Stripe from 'stripe';
import { CircuitBreaker } from './circuitBreaker.js';

export interface BillingCheckoutInput {
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface BillingWebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface BillingPriceMutationInput {
  unitAmount: number;
  currency: string;
  nickname: string;
  recurringInterval?: 'day' | 'week' | 'month' | 'year';
}

export interface BillingPriceMutationResult {
  mode: 'stripe' | 'simulated';
  priceId: string;
  unitAmount: number;
  currency: string;
  nickname: string;
}

export class BillingService {
  private readonly stripe: Stripe;
  private readonly breaker = new CircuitBreaker(3, 15_000);
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.stripe = new Stripe(apiKey, { apiVersion: '2025-02-24.acacia' });
  }

  async createCheckoutSession(input: BillingCheckoutInput): Promise<{ url: string }> {
    return this.breaker.execute(async () => {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: input.customerEmail,
        line_items: [{ price: input.priceId, quantity: 1 }],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      if (!session.url) {
        throw new Error('Checkout session did not return a URL');
      }

      return { url: session.url };
    });
  }

  async mutatePrice(input: BillingPriceMutationInput): Promise<BillingPriceMutationResult> {
    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      return {
        mode: 'simulated',
        priceId: `simulated_${Date.now()}`,
        unitAmount: input.unitAmount,
        currency: input.currency.toUpperCase(),
        nickname: input.nickname,
      };
    }

    return this.breaker.execute(async () => {
      const price = await this.stripe.prices.create({
        unit_amount: input.unitAmount,
        currency: input.currency.toLowerCase(),
        recurring: { interval: input.recurringInterval || 'month' },
        nickname: input.nickname,
        product_data: { name: input.nickname },
      });

      return {
        mode: 'stripe',
        priceId: price.id,
        unitAmount: price.unit_amount ?? input.unitAmount,
        currency: (price.currency || input.currency).toUpperCase(),
        nickname: price.nickname || input.nickname,
      };
    });
  }

  async handleWebhook(event: BillingWebhookEvent): Promise<void> {
    return this.breaker.execute(async () => {
      switch (event.type) {
        case 'checkout.session.completed': {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[BILLING] checkout completed', event.id);
          }
          break;
        }
        case 'invoice.payment_failed': {
          console.warn('[BILLING] payment failed', event.id);
          break;
        }
        default: {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[BILLING] ignored event', event.type);
          }
        }
      }
    });
  }
}
