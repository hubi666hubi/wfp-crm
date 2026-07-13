export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LeadPayload {
  name: string;
  email: string;
  message: string;
  priority: LeadPriority;
}

export interface NormalizedLeadPayload extends LeadPayload {
  name: string;
  email: string;
  message: string;
  priority: LeadPriority;
}

const VALID_PRIORITIES: ReadonlySet<LeadPriority> = new Set(['LOW', 'MEDIUM', 'HIGH']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateLeadPayload(input: unknown): NormalizedLeadPayload {
  if (!isRecord(input)) {
    throw new Error('Invalid lead payload: expected an object');
  }

  const { name, email, message, priority } = input;

  if (!isNonEmptyString(name)) {
    throw new Error('Invalid lead payload: name is required');
  }

  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    throw new Error('Invalid email');
  }

  if (!isNonEmptyString(message)) {
    throw new Error('Invalid lead payload: message is required');
  }

  if (!isNonEmptyString(priority) || !VALID_PRIORITIES.has(priority as LeadPriority)) {
    throw new Error('Invalid lead payload: priority must be LOW, MEDIUM, or HIGH');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    priority: priority.trim().toUpperCase() as LeadPriority,
  };
}
