import { z } from 'zod';

export const SEED_KINDS = ['artist', 'tv_show', 'movie', 'brand', 'book', 'podcast'] as const;
export type SeedKind = (typeof SEED_KINDS)[number];
export const seedSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(SEED_KINDS),
});
export const briefInputSchema = z.object({
  client: z.array(seedSchema).min(1).max(5),
  you: z.array(seedSchema).min(1).max(5),
  resultKind: z.enum(SEED_KINDS),
  city: z.string().trim().max(60).optional(),
});
export type BriefInput = z.infer<typeof briefInputSchema>;

export type EntityView = { name: string; tags: string[] };
export type DoorwayView = EntityView & {
  /** No unrelated control seed puts this entity in its own top three. */
  specific: boolean;
  nearClient: string[];
  nearYou: string[];
  opener: string;
  /** True when Gemini wrote the opener from Qloo's returned fields, instead of the template. */
  aiOpener?: boolean;
};
export type Brief = {
  matched: { client: string[]; you: string[] };
  unresolved: string[];
  neighbourhoodSize: number;
  doorways: DoorwayView[];
  avoid: EntityView[];
  supported: boolean;
  controls: string[];
  places: EntityView[] | null;
  placesNote?: string;
};

export type AgentStep = {
  id: number;
  kind: 'read' | 'search' | 'confirm' | 'drop' | 'brief' | 'finish' | 'ask' | 'error';
  title: string;
  detail?: string;
  source: string;
};

export type AgentResult = {
  status: 'ready' | 'needs_input' | 'held';
  question?: string;
  summary: string;
  brief?: Brief;
  tried: { kind: SeedKind; supported: boolean; specific: number }[];
  turns: number;
};
