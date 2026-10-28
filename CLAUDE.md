# Doorway

Independent Qloo hackathon project: meeting prep for one person meeting one business
counterpart. Headline output is a **doorway** (the entity in the client's taste
neighbourhood closest to the user's own tastes) plus a question to ask; supporting
output is places/experiences/gifts for the client. Work on `main`; no remote is
configured initially. Never modify Common Ground, Partner Mix, Talent Desk, Common
Hours, TripRescue or any submitted artifact.

- Follow `~/code/AGENTS.md`. No unsolicited browser or visual QA.
- `npm run check` runs formatting, tests and type checking; `npm run pairs` is the
  opt-in live pair test (capped requests, invented seeds only).
- Qloo only establishes cultural associations. A doorway is "closest among this
  client's neighbours", never evidence that two people are connected, will bond, or
  that the client likes it. Re-ranking always returns an order, so every doorway is
  compared against unrelated control seeds (`server/doorway.ts`).
- LLM text must be grounded in returned Qloo fields (tags, adjectives) and never
  invent a connection. The user should only be told to say what they would honestly say.
- Secrets stay server-side and out of source control. `QLOO_API_KEY` (hackathon test
  key) lives in Doppler `shared/dev_mac`; scripts fetch it into the child process only.

## Docs

Read `docs/index.md`. Update affected docs and `docs/log.md` in the same change.
