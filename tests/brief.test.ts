import { describe, expect, it } from 'vitest';
import { buildBrief, opener } from '../server/brief';
import type { Entity, Kind, Qloo, Ranked } from '../server/qloo';

const ent = (name: string, kind: Kind = 'artist'): Entity => ({
  entityId: `00000000-0000-4000-8000-${name
    .padEnd(12, '0')
    .slice(0, 12)
    .replace(/[^0-9a-f]/gi, '0')}`,
  name,
  kind,
});
const NAMES = ['Muse', 'Placebo', 'Beck', 'Pixies', 'Blur', 'Interpol'];
const hood = NAMES.map((n, i) => ent(n + i));

function fakeQloo(order: (seedId: string) => string[]): Qloo {
  return {
    async search(query) {
      return query === 'Nope' ? [] : [ent(query)];
    },
    async insights(_k, seeds, _take, candidates, location) {
      if (location)
        return [{ entity: ent('Cloud Gate', 'place'), rank: 1, contributingSeedIds: [] }];
      const list = candidates
        ? order(seeds[0]!)
            .map((id) => hood.find((h) => h.entityId === id)!)
            .filter(Boolean)
        : hood;
      return list.map<Ranked>((entity, i) => ({
        entity,
        rank: i + 1,
        contributingSeedIds: [seeds[0]!],
      }));
    },
  };
}

describe('buildBrief', () => {
  it('returns doorways, things to avoid and places, with the user as contributor', async () => {
    const ids = hood.map((h) => h.entityId);
    const q = fakeQloo((seed) => (seed === ent('Metallica').entityId ? ids : [...ids].reverse()));
    const brief = await buildBrief(q, {
      client: [{ name: 'Radiohead', kind: 'artist' }],
      you: [{ name: 'Metallica', kind: 'artist' }],
      resultKind: 'artist',
      city: 'Chicago',
    });
    expect(brief.doorways.map((d) => d.name)).toEqual(['Muse0', 'Placebo1', 'Beck2']);
    expect(brief.doorways[0]!.nearYou).toEqual(['Metallica']);
    expect(brief.avoid).toHaveLength(3);
    expect(brief.places?.[0]?.name).toBe('Cloud Gate');
  });
  it('reports unmatched interests and refuses when a side has none', async () => {
    const q = fakeQloo(() => hood.map((h) => h.entityId));
    await expect(
      buildBrief(q, {
        client: [{ name: 'Nope', kind: 'artist' }],
        you: [{ name: 'A', kind: 'artist' }],
        resultKind: 'artist',
      }),
    ).rejects.toThrow(/client interests/);
    const ok = await buildBrief(q, {
      client: [
        { name: 'Radiohead', kind: 'artist' },
        { name: 'Nope', kind: 'artist' },
      ],
      you: [{ name: 'A', kind: 'artist' }],
      resultKind: 'artist',
    });
    expect(ok.unresolved).toEqual(['Nope']);
  });
  it('words the opener without inventing a shared interest', () => {
    expect(opener('Muse', 'Radiohead', 'Metallica')).toMatch(/more into Metallica than Radiohead/);
    expect(opener('Muse')).not.toMatch(/undefined/);
  });
});
