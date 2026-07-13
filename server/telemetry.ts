export interface TelemetryEvent {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export class TelemetryCollector {
  private readonly events: TelemetryEvent[] = [];

  record(event: TelemetryEvent): void {
    this.events.push(event);
  }

  snapshot(): TelemetryEvent[] {
    return [...this.events];
  }
}
