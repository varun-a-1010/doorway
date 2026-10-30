# Doorway

Meeting prep for one person meeting one counterpart. Describe the meeting in a sentence or two, and
an agent finds the closest way in: something in their taste neighbourhood that sits nearest to yours.
Built for the Qloo Agentic Hackathon.

**Live demo:** https://doorway.slate-app.online

## How it works

The agent chooses its own steps. It searches Qloo for each taste in your note and confirms who it
belongs to. If either person has no named taste, it stops and asks. Then it runs a brief, judges the
result, and tries another kind of thing if the result is weak, up to three times. In a live run it
tried TV shows, found them weak, moved to artists, and chose those.

Each brief is deterministic:

1. Qloo returns the counterpart's neighbourhood of related entities.
2. That exact list is re-ranked by your interests.
3. The same list is re-ranked by unrelated control interests. A re-ranking always returns an order,
   so a doorway only counts if your interests surface it and the controls do not.

The server enforces what the model cannot break: references must appear in your note, interests must
come from a real search, and an opener is kept only if it names a doorway the brief returned, with
the template used otherwise. Openers written by Gemini are labelled. Gemini 4 Argon reads the note,
and Flash models handle routine turns and catch rate limits. You can also enter interests by hand,
which needs no LLM.

Affinity is normalized per query, so only relative order is used. A doorway means "closest among
these". It is never evidence that two people will get along.

## Run it locally

Requires Node 22.12 or newer, a Qloo API key and Vertex AI credentials for the agent.

```sh
npm ci
cp .env.example .env   # fill in the values
node --env-file=.env --import tsx server/index.ts &
npx vite --host 127.0.0.1
```

`npm run check` runs formatting, tests and type checking.

## License

[MIT](LICENSE)
