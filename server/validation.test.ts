import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLeadPayload } from './validation.ts';

test('validates a correct lead payload', () => {
  const result = validateLeadPayload({
    name: 'Anna Kowalska',
    email: 'anna@example.com',
    message: 'Chcę poznać ofertę',
    priority: 'HIGH',
  });

  assert.equal(result.name, 'Anna Kowalska');
  assert.equal(result.email, 'anna@example.com');
  assert.equal(result.priority, 'HIGH');
});

test('rejects an invalid email', () => {
  assert.throws(
    () =>
      validateLeadPayload({
        name: 'Jan',
        email: 'invalid-email',
        message: 'hello',
        priority: 'LOW',
      }),
    /Invalid email/
  );
});
