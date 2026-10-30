import type { AgentResult, AgentStep, Brief, BriefInput } from '../shared/brief';

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

export async function runAgent(note: string, onStep: (step: AgentStep) => void) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'The agent could not start. Try again.');
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let result: AgentResult | undefined;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === 'step') onStep(event.step);
      if (event.type === 'result') result = event.result;
      if (event.type === 'error') throw new Error(event.message);
    }
  }
  if (!result) throw new Error('The agent stopped before finishing. Try again.');
  return result;
}
