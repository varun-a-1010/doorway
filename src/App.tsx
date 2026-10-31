import { DoorOpen, MapPin, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SEED_KINDS, type Brief, type EntityView, type SeedKind } from '../shared/brief';
import { fetchBrief, fetchStatus } from './api';
import { AgentPanel } from './AgentPanel';

type Row = { name: string; kind: SeedKind };
const KIND_LABEL: Record<SeedKind, string> = {
  artist: 'Artist',
  tv_show: 'TV show',
  movie: 'Movie',
  brand: 'Brand',
  book: 'Book',
  podcast: 'Podcast',
};
const SAMPLES: { label: string; client: Row[]; you: Row[]; city: string; kind: SeedKind }[] = [
  {
    label: 'Lunch with a comedy fan',
    client: [
      { name: 'Seinfeld', kind: 'tv_show' },
      { name: 'Tears for Fears', kind: 'artist' },
    ],
    you: [{ name: 'The Office', kind: 'tv_show' }],
    city: 'Los Angeles',
    kind: 'tv_show',
  },
  {
    label: 'Golf with a new client',
    client: [
      { name: 'PGA Tour', kind: 'brand' },
      { name: 'Boardwalk Empire', kind: 'tv_show' },
    ],
    you: [{ name: 'Daft Punk', kind: 'artist' }],
    city: 'New York',
    kind: 'movie',
  },
  {
    label: 'Drinks with a Knicks fan',
    client: [
      { name: 'New York Knicks', kind: 'brand' },
      { name: 'The Mandalorian', kind: 'tv_show' },
    ],
    you: [{ name: 'Radiohead', kind: 'artist' }],
    city: 'New York',
    kind: 'movie',
  },
  {
    label: 'Dinner with a Chelsea supporter',
    client: [
      { name: 'Chelsea F.C.', kind: 'brand' },
      { name: 'Everything Everywhere All at Once', kind: 'movie' },
    ],
    you: [{ name: 'Taylor Swift', kind: 'artist' }],
    city: 'London',
    kind: 'movie',
  },
];

function Seeds({
  title,
  hint,
  rows,
  onChange,
}: {
  title: string;
  hint: string;
  rows: Row[];
  onChange: (r: Row[]) => void;
}) {
  const set = (i: number, patch: Partial<Row>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className="card">
      <legend>{title}</legend>
      <p className="hint">{hint}</p>
      {rows.map((row, i) => (
        <div className="seed" key={i}>
          <input
            aria-label={`${title} interest ${i + 1}`}
            value={row.name}
            maxLength={80}
            placeholder="e.g. Radiohead"
            onChange={(e) => set(i, { name: e.target.value })}
          />
          <select
            aria-label="Type"
            value={row.kind}
            onChange={(e) => set(i, { kind: e.target.value as SeedKind })}
          >
            {SEED_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          {rows.length > 1 && (
            <button
              type="button"
              className="icon"
              aria-label="Remove"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      {rows.length < 5 && (
        <button
          type="button"
          className="link"
          onClick={() => onChange([...rows, { name: '', kind: 'artist' }])}
        >
          <Plus size={14} /> Add another
        </button>
      )}
    </fieldset>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return tags.length ? <p className="tags">{tags.join(' · ')}</p> : null;
}

export function Results({ brief }: { brief: Brief }) {
  const names = (list: string[]) => list.join(', ');
  return (
    <div className="results">
      {(brief.unresolved.length > 0 || true) && (
        <p className="matched">
          Matched in Qloo as <strong>{names(brief.matched.client)}</strong> (them) and{' '}
          <strong>{names(brief.matched.you)}</strong> (you).
          {brief.unresolved.length > 0 && <> Not found: {names(brief.unresolved)}.</>} Check these
          are the ones you meant.
        </p>
      )}
      <h2>
        <DoorOpen size={20} /> Your doorways
      </h2>
      <p className="hint">
        From {brief.neighbourhoodSize} items near their taste, these sit closest to yours.
      </p>
      {brief.doorways.map((d) => (
        <article className="card door" key={d.name}>
          <header>
            <h3>{d.name}</h3>
            {d.specific ? (
              <span className="pill good">Specific to your taste</span>
            ) : (
              <span className="pill">Also near generic picks</span>
            )}
          </header>
          <Tags tags={d.tags} />
          {(d.nearClient.length > 0 || d.nearYou.length > 0) && (
            <p className="why">
              {d.nearClient.length > 0 && <>Qloo links it to their {names(d.nearClient)}. </>}
              {d.nearYou.length > 0 && <>Closest of the group to your {names(d.nearYou)}.</>}
            </p>
          )}
          <blockquote>
            {d.opener}
            <small>
              {d.aiOpener
                ? 'Written by Gemini from what Qloo returned. Say only what you honestly would.'
                : 'Template wording, not AI-written. Say only what you honestly would.'}
            </small>
          </blockquote>
        </article>
      ))}
      {!brief.supported && (
        <p className="warn">
          Weak signal: unrelated test tastes ({names(brief.controls)}) rank some of the same items
          near the top, so treat these as starting points, not a strong match.
        </p>
      )}
      <h2>Poor places to start</h2>
      <p className="hint">Furthest from your taste within their neighbourhood.</p>
      <ul className="plain">
        {brief.avoid.map((e) => (
          <li key={e.name}>{e.name}</li>
        ))}
      </ul>
      {(brief.places || brief.placesNote) && (
        <>
          <h2>
            <MapPin size={20} /> Places near their taste
          </h2>
          {brief.placesNote && <p className="hint">{brief.placesNote}</p>}
          <ul className="plain">
            {brief.places?.map((p: EntityView) => (
              <li key={p.name}>
                {p.name}
                <Tags tags={p.tags} />
              </li>
            ))}
          </ul>
          {brief.places && (
            <p className="hint">
              Places are cultural matches from Qloo, not a restaurant search. Availability and
              quality are unchecked.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function App() {
  const [client, setClient] = useState<Row[]>([{ name: '', kind: 'artist' }]);
  const [you, setYou] = useState<Row[]>([{ name: '', kind: 'artist' }]);
  const [resultKind, setResultKind] = useState<SeedKind>('artist');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [status, setStatus] = useState<'connected' | 'not-connected' | 'unreachable' | 'checking'>(
    'checking',
  );
  useEffect(() => {
    void fetchStatus().then(setStatus);
  }, []);

  const filled = (rows: Row[]) =>
    rows.map((r) => ({ ...r, name: r.name.trim() })).filter((r) => r.name);
  const ready = filled(client).length > 0 && filled(you).length > 0 && !busy;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setBrief(
        await fetchBrief({
          client: filled(client),
          you: filled(you),
          resultKind,
          city: city.trim() || undefined,
        }),
      );
    } catch (err) {
      setBrief(null);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header className="top">
        <h1>Doorway</h1>
        <p>
          Find the way into someone else&apos;s taste that starts from your own. No pretending to be
          a fan.
        </p>
        {status !== 'connected' && status !== 'checking' && (
          <p className="warn">
            {status === 'unreachable'
              ? 'The local server is not running.'
              : 'Qloo is not connected.'}
          </p>
        )}
      </header>
      <AgentPanel />
      <h2 className="manual">Or enter interests yourself</h2>
      <section className="samples" aria-label="Examples">
        <span>Try:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            className="chip"
            onClick={() => {
              setClient(s.client);
              setYou(s.you);
              setCity(s.city);
              setResultKind(s.kind);
              setBrief(null);
            }}
          >
            {s.label}
          </button>
        ))}
      </section>
      <form onSubmit={submit}>
        <div className="grid">
          <Seeds
            title="Who you are meeting"
            hint="What you know they like."
            rows={client}
            onChange={setClient}
          />
          <Seeds title="You" hint="What you actually like." rows={you} onChange={setYou} />
        </div>
        <div className="options card">
          <label>
            Look for doorways in
            <select value={resultKind} onChange={(e) => setResultKind(e.target.value as SeedKind)}>
              {SEED_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}s
                </option>
              ))}
            </select>
          </label>
          <label>
            Meeting city (optional)
            <input
              value={city}
              maxLength={60}
              placeholder="e.g. Chicago"
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <button className="primary" disabled={!ready}>
            {busy ? 'Asking Qloo…' : 'Find my doorway'}
          </button>
        </div>
      </form>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      {brief && <Results brief={brief} />}
      <footer>
        Qloo shows cultural association only. A doorway is the closest option among this
        person&apos;s taste neighbours, not evidence that you will connect or that they like it.
      </footer>
    </main>
  );
}
