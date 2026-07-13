import crypto from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

export type StripeSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export interface StripeEventEnvelope {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

interface IdempotencyRecord {
  eventId: string;
  status: 'processed';
  processedAt: string;
}

class MemoryIdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  has(key: string): boolean {
    return this.records.has(key);
  }

  get(key: string): IdempotencyRecord | undefined {
    return this.records.get(key);
  }

  set(key: string, record: IdempotencyRecord): void {
    this.records.set(key, record);
  }
}

export class StripeWebhookHandler {
  private readonly endpointSecret: string;
  private readonly idempotencyStore = new MemoryIdempotencyStore();

  constructor(endpointSecret: string) {
    this.endpointSecret = endpointSecret;
  }

  verifySignature(payload: string, signature: string | undefined): boolean {
    if (!signature || !this.endpointSecret) {
      return false;
    }

    const elements = signature.split(',').reduce<Record<string, string>>((accumulator, item) => {
      const [key, value] = item.split('=');
      if (key && value) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});

    const expectedSignature = crypto
      .createHmac('sha256', this.endpointSecret)
      .update(payload, 'utf8')
      .digest('hex');

    const version = elements['v1'];
    if (!version) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(`${version}=${expectedSignature}`),
      Buffer.from(`${version}=${elements['v1']}`)
    );
  }

  createIdempotencyKey(event: StripeEventEnvelope): string {
    return `stripe:${event.type}:${event.id}`;
  }

  isDuplicate(event: StripeEventEnvelope): boolean {
    const key = this.createIdempotencyKey(event);
    return this.idempotencyStore.has(key);
  }

  markProcessed(event: StripeEventEnvelope): void {
    const key = this.createIdempotencyKey(event);
    this.idempotencyStore.set(key, {
      eventId: event.id,
      status: 'processed',
      processedAt: new Date().toISOString(),
    });
  }

  async handleEvent(event: StripeEventEnvelope, repository: { saveSubscriptionStatus: (status: StripeSubscriptionStatus, payload: Record<string, unknown>) => Promise<void> }): Promise<{ handled: boolean }> {
    if (this.isDuplicate(event)) {
      return { handled: true };
    }

    this.markProcessed(event);

    const subscriptionObject = event.data?.object ?? {};
    const status = (subscriptionObject.status as StripeSubscriptionStatus | undefined) ?? 'incomplete';

    await repository.saveSubscriptionStatus(status, subscriptionObject);

    return { handled: true };
  }

  extractSignature(headers: IncomingHttpHeaders): string | undefined {
    const signature = headers['stripe-signature'];
    if (Array.isArray(signature)) {
      return signature[0];
    }
    return signature;
  }
}
