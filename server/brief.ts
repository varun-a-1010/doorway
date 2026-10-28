import type { Brief, BriefInput, DoorwayView, EntityView, SeedKind } from '../shared/brief';
import { findDoorways } from './doorway';
import type { Entity, Qloo, Ranked } from './qloo';

export class BriefError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const CONTROL_NAMES = ['Miles Davis', 'Taylor Swift'];
const NEIGHBOURS = 24;
const view = (e: Entity): EntityView => ({ name: e.name, tags: e.tags ?? [] });

export function opener(doorway: string, client?: string, you?: string): string {
  const mine = you ? `I'm more into ${you}` : `I'm not the best judge`;
  const theirs = client ? ` than ${client}` : '';
  return `${mine}${theirs}, but ${doorway} keeps coming up around what you like. Is that a good place for me to start?`;
}

/**
 * Doorway = the entity in the client's taste neighbourhood that is closest to the user's
 * seeds. Qloo only orders a fixed list, so this is "closest among these", never proof of
 * a real connection; unrelated control seeds show how much the order depends on the user.
 */
export async function buildBrief(qloo: Qloo, input: BriefInput): Promise<Brief> {
  const unresolved: string[] = [];
  const resolve = async (seeds: { name: string; kind: SeedKind }[]) => {
    const found = await Promise.all(
      seeds.map(async (s) => {
        const [top] = await qloo.search(s.name, s.kind);
        if (!top) unresolved.push(s.name);
        return top;
      }),
    );
    return found.filter((e): e is Entity => !!e);
  };
  const [client, you, controls] = await Promise.all([
    resolve(input.client),
    resolve(input.you),
    Promise.all(CONTROL_NAMES.map(async (n) => (await qloo.search(n, 'artist'))[0])).then((r) =>
      r.filter((e): e is Entity => !!e),
    ),
  ]);
  if (!client.length) throw new BriefError(422, 'None of the client interests matched in Qloo.');
  if (!you.length) throw new BriefError(422, 'None of your interests matched in Qloo.');

  const neighbourhood = await qloo.insights(
    input.resultKind,
    client.map((e) => e.entityId),
    NEIGHBOURS,
  );
  if (neighbourhood.length < 4)
    throw new BriefError(
      422,
      'Qloo returned too few related items to compare. Try other interests.',
    );
  const ids = neighbourhood.map((r) => r.entity.entityId);
  const rerank = (seeds: Entity[]): Promise<Ranked[]> =>
    qloo.insights(
      input.resultKind,
      seeds.map((s) => s.entityId),
      ids.length,
      ids,
    );
  const own = new Set([...client, ...you].map((e) => e.entityId));
  const usable = controls.filter((c) => !own.has(c.entityId));
  const [bySeller, ...byControls] = await Promise.all([
    rerank(you),
    ...usable.map((c) => rerank([c])),
  ]);
  const result = findDoorways(bySeller, byControls);

  const nameOf = new Map([...client, ...you].map((e) => [e.entityId, e.name]));
  const names = (r: Ranked | undefined) =>
    (r?.contributingSeedIds ?? []).flatMap((id) => nameOf.get(id) ?? []);
  const specific = new Set(result.specific.map((e) => e.entityId));
  const doorways: DoorwayView[] = result.doorways.map((e) => {
    const nearClient = names(neighbourhood.find((r) => r.entity.entityId === e.entityId));
    const nearYou = names(bySeller.find((r) => r.entity.entityId === e.entityId));
    return {
      ...view(e),
      specific: specific.has(e.entityId),
      nearClient,
      nearYou,
      opener: opener(e.name, nearClient[0] ?? client[0]?.name, nearYou[0] ?? you[0]?.name),
    };
  });

  let places: EntityView[] | null = null,
    placesNote: string | undefined;
  if (input.city) {
    try {
      const rows = await qloo.insights(
        'place',
        client.map((e) => e.entityId),
        8,
        undefined,
        input.city,
      );
      places = rows.map((r) => view(r.entity));
      if (!places.length) placesNote = `Qloo returned no places for ${input.city}.`;
    } catch {
      placesNote = `Places for ${input.city} could not be fetched.`;
    }
  }
  return {
    matched: { client: client.map((e) => e.name), you: you.map((e) => e.name) },
    unresolved,
    neighbourhoodSize: neighbourhood.length,
    doorways,
    avoid: result.avoid.map(view),
    supported: result.supported,
    controls: usable.map((c) => c.name),
    places,
    placesNote,
  };
}
