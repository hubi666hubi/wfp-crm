import assert from 'node:assert/strict';
import test from 'node:test';
import { FinOpsLedger } from './finops.js';
import { HotSwapMonitor } from './hotSwap.js';
import { PromptCompiler } from './promptCompiler.js';

test('FinOpsLedger flags expensive workloads when LTV is low', () => {
  const ledger = new FinOpsLedger();
  ledger.record('user-1', 400, 'USD', 'heavy agent run');
  ledger.record('user-2', 100, 'USD', 'small run');

  const analysis = ledger.evaluateEfficiency(500);

  assert.equal(analysis.totalSpend, 500);
  assert.equal(analysis.shouldMutatePricing, true);
  assert.equal(analysis.riskLevel, 'medium');
});

test('PromptCompiler reuses success memory for future compilation', () => {
  const compiler = new PromptCompiler();
  compiler.registerSuccess('agent-a', 'Use concise steps', 0.92);

  const result = compiler.compile('agent-a', 'You are helpful', []);

  assert.equal(result.selectedPrompt.includes('Use concise steps'), true);
  assert.equal(result.variants.length, 5);
});

test('HotSwapMonitor can hot-load a module from disk', async () => {
  const monitor = new HotSwapMonitor();
  await monitor.registerFromFile('fixture', './server/__fixtures__/hotSwapFixture.ts');

  const loaded = await monitor.load('fixture');

  assert.equal(loaded.getMarker(), 'fixture-loaded');
});
