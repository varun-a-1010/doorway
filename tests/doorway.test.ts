import { describe, expect, it } from 'vitest';
import { findDoorways } from '../server/doorway';
import type { Ranked } from '../server/qloo';

const row = (id: string, rank: number): Ranked => ({
  entity: { entityId: id, name: `E${id}`, kind: 'artist' },
  rank,
  contributingSeedIds: [],
});
const list = (...ids: string[]) => ids.map((id, i) => row(id, i + 1));

describe('findDoorways', () => {
  it('orders by closeness and returns the closest and furthest few', () => {
    const r = findDoorways(list('a', 'b', 'c', 'd', 'e', 'f'));
    expect(r.doorways.map((e) => e.entityId)).toEqual(['a', 'b', 'c']);
    expect(r.avoid.map((e) => e.entityId)).toEqual(['d', 'e', 'f']);
  });
  it('treats doorways that a control also ranks highly as not specific', () => {
    const r = findDoorways(list('a', 'b', 'c', 'd'), [list('a', 'b', 'x', 'y')]);
    expect(r.specific.map((e) => e.entityId)).toEqual(['c']);
    expect(r.supported).toBe(false);
  });
  it('supports a doorway set that no control reproduces', () => {
    const r = findDoorways(list('a', 'b', 'c', 'd'), [list('d', 'c', 'b', 'a')]);
    expect(r.specific.map((e) => e.entityId)).toEqual(['a']);
    expect(findDoorways(list('a', 'b', 'c', 'd', 'e'), [list('e', 'd', 'x', 'a')]).supported).toBe(
      true,
    );
  });
  it('handles an empty neighbourhood', () => {
    expect(findDoorways([])).toMatchObject({ ordered: [], doorways: [], supported: false });
  });
});
