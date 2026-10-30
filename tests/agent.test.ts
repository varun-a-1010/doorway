import { describe, expect, it, vi } from 'vitest';
import type { GenerateContentResponse } from '@google/genai';
import { AgentUnavailable, createAgent } from '../server/agent';
import { withFallback } from '../server/models';
import type { Qloo } from '../server/qloo';

const call = (name: string, args: Record<string, unknown> = {}) => ({ name, args, id: name });
const reply = (...calls: ReturnType<typeof call>[]) =>
  ({
    candidates: [{ content: { role: 'model', parts: [] }, finishReason: 'STOP' }],
    functionCalls: calls,
  }) as unknown as GenerateContentResponse;
const NOTE = 'Meeting Dana, who loves Bruce Springsteen. I listen to Radiohead.';
const ids = { SPRINGSTEEN: 'S', RADIOHEAD: 'R' };
const entity = (entityId: string, name: string) => ({ entityId, name, tags: ['Rock'] });

const qloo = (): Qloo =>
  ({
    search: vi.fn(async (query: string) =>
      query.includes('Radio')
        ? [entity(ids.RADIOHEAD, 'Radiohead')]
        : query.includes('Spring')
          ? [entity(ids.SPRINGSTEEN, 'Bruce Springsteen')]
          : [entity('X', query)],
    ),
    insights: vi.fn(
      async (_kind: string, _seeds: string[], _take?: number, candidates?: string[]) =>
        (candidates ?? ['A', 'B', 'C', 'D', 'E', 'F']).map((id, index) => ({
          entity: entity(id, `Item ${id}`),
          affinity: 1 - index / 10,
          contributingSeedIds: [],
        })),
    ),
  }) as unknown as Qloo;

const script = (...turns: GenerateContentResponse[]) => {
  const generate = vi.fn();
  turns.forEach((t) => generate.mockResolvedValueOnce(t));
  return generate;
};
const searchFor = (reference: string) =>
  call('search_qloo', { reference, query: reference, kind: 'artist' });
const confirm = (person: string, reference: string, entity_id: string) =>
  call('confirm_interest', { person, reference, entity_id });
const prepared = [
  reply(searchFor('Bruce Springsteen'), searchFor('Radiohead')),
  reply(
    confirm('client', 'Bruce Springsteen', ids.SPRINGSTEEN),
    confirm('you', 'Radiohead', ids.RADIOHEAD),
  ),
];

describe('meeting agent', () => {
  it('resolves both people, runs a brief and keeps its opener only when it names the doorway', async () => {
    const generate = script(
      ...prepared,
      reply(call('run_brief', { kind: 'artist' })),
      reply(
        call('finish', {
          kind: 'artist',
          summary: 'Artists worked.',
          openers: [
            { doorway: 'Item A', opener: 'Item A keeps coming up around what you like.' },
            { doorway: 'Item B', opener: 'You and I both love this.' },
          ],
        }),
      ),
    );
    const result = await createAgent({ generate, qloo: qloo() }).run(NOTE);
    expect(result.status).toBe('ready');
    const [first, second] = result.brief!.doorways;
    expect(first).toMatchObject({ name: 'Item A', aiOpener: true });
    expect(second?.aiOpener).toBeUndefined();
  });

  it('tries another kind after a weak brief and can only finish on one it ran', async () => {
    const generate = script(
      ...prepared,
      reply(call('run_brief', { kind: 'artist' })),
      reply(call('finish', { kind: 'book', summary: '', openers: [] })),
      reply(call('run_brief', { kind: 'book' })),
      reply(call('finish', { kind: 'book', summary: 'Books worked.', openers: [] })),
    );
    const result = await createAgent({ generate, qloo: qloo() }).run(NOTE);
    expect(result.tried.map((t) => t.kind)).toEqual(['artist', 'book']);
    expect(generate).toHaveBeenCalledTimes(6);
  });

  it('refuses references outside the note and entities it never searched', async () => {
    const provider = qloo();
    const generate = script(
      reply(searchFor('Taylor Swift')),
      reply(confirm('client', 'Bruce Springsteen', 'NOT-SEARCHED')),
      reply(call('run_brief', { kind: 'artist' })),
      reply(call('ask_user', { question: 'What do they like?' })),
    );
    const result = await createAgent({ generate, qloo: provider }).run(NOTE);
    expect(provider.search).not.toHaveBeenCalled();
    expect(provider.insights).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'needs_input', question: 'What do they like?' });
  });

  it('caps briefs at three kinds', async () => {
    const provider = qloo();
    const kinds = ['artist', 'book', 'movie', 'brand'];
    const generate = script(
      ...prepared,
      ...kinds.map((kind) => reply(call('run_brief', { kind }))),
      reply(call('finish', { kind: 'artist', summary: 'Done', openers: [] })),
    );
    const result = await createAgent({ generate, qloo: provider }).run(NOTE);
    expect(result.tried).toHaveLength(3);
  });

  it('returns the strongest brief if it runs out of turns', async () => {
    const generate = vi.fn(async () => reply(call('unknown_tool')));
    prepared.forEach((turn) => generate.mockResolvedValueOnce(turn));
    generate.mockResolvedValueOnce(reply(call('run_brief', { kind: 'artist' })));
    const result = await createAgent({ generate, qloo: qloo() }).run(NOTE);
    expect(result.status).toBe('ready');
    expect(result.brief).toBeDefined();
  });

  it('leads with Argon and survives a rate limit on it', async () => {
    const generate = vi.fn(async (request: { model: string }) => {
      if (request.model === 'gemini-4-argon') throw new Error('429');
      return reply(call('ask_user', { question: 'Who are you meeting?' }));
    });
    const result = await createAgent({ generate, qloo: qloo() }).run(NOTE);
    expect(generate.mock.calls.map((c) => c[0].model)).toEqual([
      'gemini-4-argon',
      'gemini-3.5-flash-lite',
    ]);
    expect(result.status).toBe('needs_input');
  });

  it('reports failure only when no model can answer', async () => {
    const generate = vi.fn(async () => {
      throw new Error('429');
    });
    await expect(
      createAgent({ generate, qloo: qloo(), sleep: async () => {} }).run(NOTE),
    ).rejects.toBeInstanceOf(AgentUnavailable);
  });

  it('backs off and walks the chain again when every model is limited at once', async () => {
    let calls = 0;
    const out = await withFallback(
      ['a', 'b'],
      async () => {
        if (++calls <= 3) throw new Error('429');
        return 'ok';
      },
      { sleep: async () => {} },
    );
    expect(out.value).toBe('ok');
  });
});
