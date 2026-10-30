# Doorway

Meeting prep for one person meeting one counterpart. Enter a few interests for them and for you, and
Doorway finds the closest way in: something in their taste neighbourhood that sits nearest to yours.
Built for the Qloo Agentic Hackathon.

**Live demo:** https://doorway.slate-app.online

## How it works

1. Qloo resolves both people's interests to real entities.
2. Qloo returns the counterpart's neighbourhood of related entities.
3. That exact list is re-ranked by your interests.
4. The same list is re-ranked by unrelated control interests. A re-ranking always returns an order,
   so a doorway only counts if your interests surface it and the controls do not.

Affinity is normalized per query, so only relative order is used. A doorway means "closest among
these". It is never evidence that two people will get along.

## Run it locally

Requires Node 22.12 or newer and a Qloo API key.

```sh
npm ci
cp .env.example .env   # fill in the value
node --env-file=.env --import tsx server/index.ts &
npx vite --host 127.0.0.1
```

`npm run check` runs formatting, tests and type checking.

## License

[MIT](LICENSE)
