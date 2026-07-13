export interface RedisLikeClient {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  set?: (key: string, value: string) => Promise<void>;
  get?: (key: string) => Promise<string | null>;
}

export class RedisAdapter {
  constructor(private readonly client: RedisLikeClient | null) {}

  async connect(): Promise<void> {
    if (!this.client?.connect) {
      return;
    }
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (!this.client?.disconnect) {
      return;
    }
    await this.client.disconnect();
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client?.set) {
      return;
    }
    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    if (!this.client?.get) {
      return null;
    }
    return this.client.get(key);
  }
}
