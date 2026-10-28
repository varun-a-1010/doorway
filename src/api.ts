import type { Brief, BriefInput } from '../shared/brief';

export async function fetchBrief(input: BriefInput): Promise<Brief> {
  const response = await fetch('/api/brief', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = (await response.json().catch(() => null)) as (Brief & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error ?? 'Something went wrong. Try again.');
  return body;
}

export async function fetchStatus(): Promise<'connected' | 'not-connected' | 'unreachable'> {
  try {
    const response = await fetch('/api/status');
    return ((await response.json()) as { qloo: 'connected' | 'not-connected' }).qloo;
  } catch {
    return 'unreachable';
  }
}
