# Log

## 2026-10-31

- Added three meetings tested on Qloo, across food, games and racing, and made every agent example
  a clickable chip. Candidates with odd results, such as a hip-hop fan to Rolex, were left out.
- Added a second Vertex project. A failed call now tries the same model there before the chain
  moves to the next model. A forced test moved the agent between projects twice mid-run and it
  still finished its brief.
- Added per-client rate limiting and trusted the local nginx proxy for hosting.
- Deployed to Motif at doorway.slate-app.online and published the repository under MIT.
- Replaced the music-only samples with everyday meetings across sports, TV and film, each with the
  result kind that tested strongest. Added bounded retries for Qloo rate limits and server errors.
- Added a Gemini meeting agent that reads a free-text note, resolves tastes on Qloo, judges each
  brief against its control check, retries other kinds and writes grounded openers. Rules the
  model cannot break are enforced by the server. Manual entry still works with no LLM.

- 2026-10-28: Repo created from the Common Ground engine. Added doorway re-ranking with
  control comparison and an opt-in pair test. First run: 8 pairs, 48 requests.
- 2026-10-28: Added the local interface (Fastify API + React/Vite), `shared/brief.ts`, brief
  orchestration and tests (7 passing). API verified against live Qloo with curl for the
  Metallica/Radiohead/Chicago case; no browser or visual QA was done.
