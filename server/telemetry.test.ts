import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryCollector, TelemetryEvent } from './telemetry';

describe('TelemetryCollector', () => {
  let collector: TelemetryCollector;

  beforeEach(() => {
    collector = new TelemetryCollector();
  });

  it('should initialize with an empty array of events', () => {
    expect(collector.snapshot()).toEqual([]);
  });

  it('should record a single event without tags correctly', () => {
    const event: TelemetryEvent = { name: 'cpu_usage', value: 45.5 };
    collector.record(event);

    const snapshot = collector.snapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toEqual(event);
  });

  it('should record an event with tags correctly', () => {
    const event: TelemetryEvent = {
      name: 'memory_usage',
      value: 1024,
      tags: { service: 'backend', env: 'production' }
    };
    collector.record(event);

    const snapshot = collector.snapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toEqual(event);
  });

  it('should record multiple events in the correct order', () => {
    const event1: TelemetryEvent = { name: 'event_1', value: 1 };
    const event2: TelemetryEvent = { name: 'event_2', value: 2, tags: { type: 'test' } };
    const event3: TelemetryEvent = { name: 'event_3', value: 3 };

    collector.record(event1);
    collector.record(event2);
    collector.record(event3);

    const snapshot = collector.snapshot();
    expect(snapshot).toHaveLength(3);
    expect(snapshot).toEqual([event1, event2, event3]);
  });

  it('should return a shallow copy of the events array in snapshot', () => {
    const event: TelemetryEvent = { name: 'test_event', value: 100 };
    collector.record(event);

    const snapshot = collector.snapshot();
    expect(snapshot).toHaveLength(1);

    // Mutate the returned snapshot array
    snapshot.push({ name: 'mutated_event', value: 999 });

    // Original collector should be unaffected
    const newSnapshot = collector.snapshot();
    expect(newSnapshot).toHaveLength(1);
    expect(newSnapshot[0]).toEqual(event);
  });
});
