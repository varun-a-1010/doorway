import { useState } from 'react';
import type { AgentResult, AgentStep } from '../shared/brief';
import { runAgent } from './api';
import { Results } from './App';

const SAMPLE =
  'Meeting Dana on Thursday. She is always talking about Bruce Springsteen, Yellowstone and The Bear. I mostly listen to Radiohead and just finished Severance.';

export function AgentPanel() {
  const [note, setNote] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AgentResult>();

  async function run() {
    setBusy(true);
    setError('');
    setSteps([]);
    setResult(undefined);
    try {
      setResult(await runAgent(note, (step) => setSteps((list) => [...list, step])));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card agent" aria-labelledby="agent-title">
      <h2 id="agent-title">Tell it about the meeting</h2>
      <p className="hint">
        Say what you know about them and what you like. An agent finds those on Qloo, looks for a
        doorway, and tries other kinds of things if the first result is weak.
      </p>
      <textarea
        rows={3}
        maxLength={800}
        value={note}
        placeholder={SAMPLE}
        aria-label="Notes about the meeting"
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="agent-actions">
        <button type="button" className="link" disabled={busy} onClick={() => setNote(SAMPLE)}>
          Use the example
        </button>
        <button
          type="button"
          className="primary"
          disabled={busy || note.trim().length < 20}
          onClick={run}
        >
          {busy ? 'Preparing' : 'Prepare me'}
        </button>
      </div>
      {error && (
        <p className="warn" role="alert">
          {error}
        </p>
      )}
      {steps.length > 0 && (
        <ol className="trace" aria-live="polite">
          {steps.map((step) => (
            <li key={step.id}>
              <div>
                <strong>{step.title}</strong>
                {step.detail && <p>{step.detail}</p>}
              </div>
              <small>{step.source}</small>
            </li>
          ))}
        </ol>
      )}
      {result?.question && <p className="agent-note">{result.question}</p>}
      {result?.summary && !result.question && <p className="agent-note">{result.summary}</p>}
      {result?.brief && <Results brief={result.brief} />}
    </section>
  );
}
