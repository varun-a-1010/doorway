import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createQloo, type Entity, type Ranked } from '../server/qloo';
import { findDoorways } from '../server/doorway';

// Explicit opt-in live check on invented salesperson/client artist pairs (no personal data).
// Budget is capped; ~6 requests per pair.
assert(process.env.QLOO_API_KEY, 'QLOO_API_KEY must be configured in process memory.');
const budget = 70;
let requested = 0;
const qloo = createQloo({
  apiKey: process.env.QLOO_API_KEY,
  fetch: (input, init) => {
    assert(++requested <= budget, 'Live Qloo request budget exhausted.');
    return fetch(input, init);
  },
});
const pairs: { kind: 'far' | 'similar'; seller: string; client: string }[] = [
  { kind: 'far', seller: 'Metallica', client: 'Radiohead' },
  { kind: 'far', seller: 'Johnny Cash', client: 'Kendrick Lamar' },
  { kind: 'far', seller: 'Taylor Swift', client: 'Slipknot' },
  { kind: 'far', seller: 'Miles Davis', client: 'Wu-Tang Clan' },
  { kind: 'far', seller: 'Willie Nelson', client: 'Beyoncé' },
  { kind: 'far', seller: 'Dolly Parton', client: 'Bad Bunny' },
  { kind: 'similar', seller: 'Radiohead', client: 'Arcade Fire' },
  { kind: 'similar', seller: 'Metallica', client: 'Iron Maiden' },
];
const controlNames = ['Miles Davis', 'Taylor Swift'];
const resolve = async (name: string): Promise<Entity> => {
  const [top] = await qloo.search(name, 'artist');
  assert(top, `Could not resolve ${name}`);
  return top;
};
const controls = await Promise.all(controlNames.map(resolve));
const out: unknown[] = [];
for (const pair of pairs) {
  const [seller, client] = [await resolve(pair.seller), await resolve(pair.client)];
  const hood = await qloo.insights('artist', [client.entityId], 24);
  const ids = hood.map((r) => r.entity.entityId);
  const rerank = (seed: Entity): Promise<Ranked[]> =>
    qloo.insights('artist', [seed.entityId], ids.length, ids);
  const bySeller = await rerank(seller);
  // A control equal to the pair's own seller or client would tell us nothing.
  const useful = controls.filter(
    (c) => c.entityId !== seller.entityId && c.entityId !== client.entityId,
  );
  const byControls = await Promise.all(useful.map(rerank));
  const result = findDoorways(bySeller, byControls);
  const row = {
    kind: pair.kind,
    seller: seller.name,
    client: client.name,
    neighbourhoodSize: hood.length,
    reranked: bySeller.length,
    doorways: result.doorways.map((e) => e.name),
    avoid: result.avoid.map((e) => e.name),
    specific: result.specific.map((e) => e.name),
    supported: result.supported,
    controlsUsed: useful.map((c) => c.name),
  };
  out.push(row);
  console.log(JSON.stringify(row));
}
const report = { fetchedAt: new Date().toISOString(), requests: requested, pairs: out };
console.log(`requests ${requested}`);
if (process.env.PAIRS_OUT)
  writeFileSync(process.env.PAIRS_OUT, JSON.stringify(report, null, 2), { mode: 0o600 });
