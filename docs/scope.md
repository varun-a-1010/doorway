---
type: Reference
title: Scope and assumptions
description: What Doorway claims, what each supplier provides, and what is demonstrated or untested.
timestamp: 2026-10-28
last_verified: 2026-10-28
---

**Claim.** Before meeting one counterpart, give the user (1) places, experiences and
gifts suited to the client's stated tastes and (2) a **doorway**: the entity in the
client's taste neighbourhood closest to the user's own tastes, with a question to ask.
No claim of shared interests, rapport or business outcome.

**Mechanism.** Resolve the client's seeds; take the client's top-N neighbours with
`/v2/insights`; re-rank exactly that list under the user's seeds with
`filter.results.entities`; compare against unrelated control seeds.

| Supplier        | Provides                                                                         |
| --------------- | -------------------------------------------------------------------------------- |
| Qloo            | Client neighbourhood, closeness ordering, tags and descriptive fields per entity |
| LLM (not built) | The opener sentence and rationale, grounded in returned Qloo fields              |
| User            | Both people's stated interests, city                                             |

**Demonstrated.** `/search`; `/v2/insights` with `signal.interests.entities`;
`filter.results.entities` re-ranking; `filter.location.query` returns places (Chicago,
HTTP 200); entities carry `tags` and fields such as `adjectives_for_fans`.

**Untested.** Restaurants/experiences/gifts filters; concept inputs ("Japanese design")
do not resolve to entities, so tags or a mapping are needed; multi-seed, multi-domain
doorways; whether a person would actually say the suggested opener.

**Finding 2026-10-28** (`evidence/pairs-2026-10-28.json`, 8 artist pairs, 48 requests).
Two controls only; heuristic "supported" = at least two of three doorways absent from
the controls' top three. 3 of 8 passed; by eye 4 looked good (Miles Davis to Wu-Tang:
A Tribe Called Quest, Public Enemy, Madvillain; Taylor Swift to Slipknot: Avenged
Sevenfold, Bullet for My Valentine, Metallica), 2 questionable, 2 unremarkable. Works
best when the user's genre has a natural bridge into a varied client neighbourhood.
