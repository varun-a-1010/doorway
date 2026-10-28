import type { Entity, Ranked } from './qloo';

export type DoorwayResult = {
  /** Client-neighbourhood entities ordered by closeness to the salesperson's seeds. */
  ordered: Entity[];
  /** Closest few; the suggested ways in. */
  doorways: Entity[];
  /** Furthest few; poor places to start. */
  avoid: Entity[];
  /** Doorways no control seed also puts in its own top slots, i.e. specific to this salesperson. */
  specific: Entity[];
  /** Heuristic: at least two of the top three are specific. Never evidence of a real connection. */
  supported: boolean;
};

const TOP = 3;

/**
 * `bySeller` is the client's neighbourhood re-ranked by the salesperson's seeds;
 * `controls` are the same neighbourhood re-ranked by unrelated seeds. Qloo affinity
 * is normalised per query, so only relative order is used, and the claim is only
 * "closest among these", never that the two people are connected.
 */
export function findDoorways(bySeller: Ranked[], controls: Ranked[][] = []): DoorwayResult {
  const ordered = [...bySeller].sort(
    (a, b) => a.rank - b.rank || a.entity.name.localeCompare(b.entity.name),
  );
  const controlTop = new Set(
    controls.flatMap((c) =>
      [...c]
        .sort((a, b) => a.rank - b.rank || a.entity.name.localeCompare(b.entity.name))
        .slice(0, TOP)
        .map((r) => r.entity.entityId),
    ),
  );
  const doorways = ordered.slice(0, TOP).map((r) => r.entity);
  const specific = doorways.filter((e) => !controlTop.has(e.entityId));
  return {
    ordered: ordered.map((r) => r.entity),
    doorways,
    avoid: ordered.slice(-TOP).map((r) => r.entity),
    specific,
    supported: specific.length >= 2,
  };
}
