import { z } from 'zod';

export const QLOO_ORIGIN = 'https://hackathon.api.qloo.com';
export type Kind = 'artist' | 'brand' | 'movie' | 'tv_show' | 'book' | 'podcast' | 'place';
export type Entity = { entityId: string; name: string; kind: Kind; tags?: string[] };
export type Ranked = { entity: Entity; rank: number; contributingSeedIds: string[] };
export interface Qloo {
  search(query: string, kind: Kind): Promise<Entity[]>;
  insights(
    kind: Kind,
    seedIds: string[],
    take?: number,
    candidateIds?: string[],
    location?: string,
  ): Promise<Ranked[]>;
}

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const text = (v: unknown, length = 200) => (typeof v === 'string' ? v.slice(0, length) : '');
const uuid = z.string().uuid();

export function parseEntity(raw: unknown, kind: Kind): Entity | null {
  const r = record(raw);
  if (
    !uuid.safeParse(r.entity_id).success ||
    !text(r.name) ||
    ![...array(r.types), r.subtype].includes(`urn:entity:${kind}`)
  )
    return null;
  const tags = array(r.tags)
    .map((t) => text(record(t).name, 40))
    .filter(Boolean)
    .slice(0, 5);
  return {
    entityId: String(r.entity_id).toUpperCase(),
    name: text(r.name),
    kind,
    ...(tags.length ? { tags } : {}),
  };
}

/** Minimal read-only client: one origin, no redirects, bounded time and bytes, no retries. */
export function createQloo(
  options: { apiKey: string; fetch?: typeof fetch; timeoutMs?: number } = { apiKey: '' },
): Qloo {
  const key = options.apiKey.trim();
  if (!key) throw new Error('QLOO_API_KEY is required.');
  async function get(path: string, params: Record<string, string>) {
    const url = new URL(path, QLOO_ORIGIN);
    url.search = new URLSearchParams(params).toString();
    const response = await (options.fetch ?? fetch)(url, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMs ?? 12_000),
    });
    if (response.status === 404 && path === '/search') return { results: [] };
    if (!response.ok) throw new Error(`Qloo ${path} returned HTTP ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Empty body');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        throw new Error('Oversized body');
      }
      chunks.push(value);
    }
    const data = record(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (data.success === false || !('results' in data)) throw new Error('Unexpected response');
    return data;
  }
  return {
    async search(query, kind) {
      const data = await get('/search', {
        query: query.trim(),
        types: `urn:entity:${kind}`,
        take: '5',
      });
      return array(data.results)
        .map((r) => parseEntity(r, kind))
        .filter((e): e is Entity => e !== null);
    },
    async insights(kind, seedIds, take = 20, candidateIds, location) {
      const upper = (ids: string[], max: number) =>
        [
          ...new Set(
            z
              .array(uuid)
              .min(1)
              .max(max)
              .parse(ids)
              .map((s) => s.toUpperCase()),
          ),
        ].sort();
      const seeds = upper(seedIds, 50);
      // With candidates, Qloo only ranks that fixed list (the doorway re-rank).
      const candidates = candidateIds ? upper(candidateIds, 50) : undefined;
      const data = await get('/v2/insights', {
        'filter.type': `urn:entity:${kind}`,
        'signal.interests.entities': seeds.join(','),
        ...(candidates
          ? { 'filter.results.entities': candidates.join(',') }
          : { 'filter.exclude.entities': seeds.join(',') }),
        ...(location?.trim() ? { 'filter.location.query': location.trim().slice(0, 80) } : {}),
        'feature.explainability': 'true',
        take: String(candidates?.length ?? take),
      });
      const rows = record(data.results).entities;
      if (!Array.isArray(rows)) throw new Error('Qloo returned an invalid insights result.');
      const seen = new Set<string>();
      const scored = rows.flatMap((r) => {
        const entity = parseEntity(r, kind),
          query = record(record(r).query);
        if (
          !entity ||
          seen.has(entity.entityId) ||
          typeof query.affinity !== 'number' ||
          !Number.isFinite(query.affinity)
        )
          return [];
        seen.add(entity.entityId);
        const contributing = array(record(query.explainability)['signal.interests.entities'])
          .map((e) => text(record(e).entity_id).toUpperCase())
          .filter((id) => seeds.includes(id));
        return [
          { entity, affinity: query.affinity, contributingSeedIds: [...new Set(contributing)] },
        ];
      });
      scored.sort(
        (a, b) => b.affinity - a.affinity || a.entity.entityId.localeCompare(b.entity.entityId),
      );
      // Affinity is normalised per query, so only relative rank is kept.
      return scored.map((r) => ({
        entity: r.entity,
        rank: 1 + scored.filter((o) => o.affinity > r.affinity).length,
        contributingSeedIds: r.contributingSeedIds,
      }));
    },
  };
}
