import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';
import { PORTFOLIO_DATA, itemId, type ApiEndpoint } from '../../data/portfolioData';
import { Section } from '../ui/Section';
import { Emerge } from '../ui/Emerge';
import { simulateRequest } from '../../lib/playground';

/** Syntax-colours a JSON string without pulling in a highlighter library.
 *  Splits on the token shapes JSON.stringify can actually produce. */
function highlight(json: string): React.ReactNode[] {
  const pattern =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)/g;

  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(json)) !== null) {
    if (match.index > last) out.push(json.slice(last, match.index));

    const [text, propKey, str, num, literal] = match;
    let color = 'var(--text-2)';
    if (propKey) color = 'var(--text)';
    else if (str) color = 'var(--accent-text)';
    else if (num) color = '#7aa2d8';
    else if (literal) color = '#c792ea';

    out.push(
      <span key={key++} style={{ color }}>
        {text}
      </span>
    );
    last = match.index + text.length;
  }

  if (last < json.length) out.push(json.slice(last));
  return out;
}

export const Playground: React.FC = () => {
  const [selected, setSelected] = useState<ApiEndpoint | undefined>(PORTFOLIO_DATA.apiEndpoints[0]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [request, setRequest] = useState('{\n  "message": "Hello!"\n}');
  const [result, setResult] = useState<{ status: number; body: Record<string, unknown> } | null>(null);

  if (!selected) {
    return (
      <Section id="playground" label="Playground" title="Or just query me.">
        <p style={{ color: 'var(--text-2)' }}>No endpoints to explore yet.</p>
      </Section>
    );
  }

  const body = JSON.stringify(result?.body ?? selected.response, null, 2);

  const run = (endpoint: ApiEndpoint) => {
    setSelected(endpoint);
    setResult(null);
    setRunning(true);
    setTimeout(() => setRunning(false), 260);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the response is on screen to select manually */
    }
  };

  return (
    <Section
      id="playground"
      label="Playground"
      title="Or just query me."
      lead="A small pretend API, because reading a bio is boring and poking at something isn't."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        {/* Endpoints */}
        <Emerge index={0}>
          <h3 className="label mb-3">Endpoints</h3>
          <ul className="flex flex-col gap-2">
            {PORTFOLIO_DATA.apiEndpoints.map((endpoint) => {
              const isActive = selected.path === endpoint.path;
              return (
                <li key={endpoint.path} id={itemId.endpoint(endpoint.path)}>
                  <button
                    type="button"
                    onClick={() => run(endpoint)}
                    aria-pressed={isActive}
                    className="w-full text-left p-3.5 rounded-[12px] transition-colors duration-200"
                    style={{
                      backgroundColor: isActive ? 'var(--bg-elev-2)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--border-strong)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="px-1.5 py-0.5 rounded font-mono font-semibold shrink-0"
                          style={{
                            fontSize: 'var(--step--2)',
                            backgroundColor:
                              endpoint.method === 'GET' ? 'var(--live-soft)' : 'var(--accent-soft)',
                            color:
                              endpoint.method === 'GET' ? 'var(--live)' : 'var(--accent-text)',
                          }}
                        >
                          {endpoint.method}
                        </span>
                        <code
                          className="truncate"
                          style={{ fontSize: 'var(--step--1)', color: 'var(--text)' }}
                        >
                          {endpoint.path}
                        </code>
                      </span>
                      <Play
                        className="w-3 h-3 shrink-0"
                        style={{ color: isActive ? 'var(--text)' : 'var(--text-3)' }}
                        aria-hidden="true"
                      />
                    </div>
                    <span style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}>
                      {endpoint.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected.method === 'POST' && <div className="mt-5">
            <label className="label" htmlFor="playground-request">Request body (JSON)</label>
            <textarea id="playground-request" className="request-editor mt-3" rows={6} spellCheck={false}
              value={request} onChange={event => { setRequest(event.target.value); setResult(null); }} />
            <button type="button" className="file-button mt-3" onClick={() => setResult(simulateRequest(request, selected.response))}>
              Run simulated request
            </button>
            <p className="mt-3" style={{ color: 'var(--text-3)', fontSize: 'var(--step--1)' }}>
              Runs only in your browser. No message is sent. Any JSON object is accepted; invalid JSON shows a simulated error.
            </p>
          </div>}
        </Emerge>

        {/* Response */}
        <Emerge index={1}>
        <div
          className="rounded-[14px] overflow-hidden flex flex-col h-full"
          style={{ backgroundColor: 'var(--bg-sunken)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <code
              className="truncate"
              style={{ fontSize: 'var(--step--2)', color: 'var(--text-3)' }}
            >
              {selected.method} {selected.path} · simulated
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy response JSON"
              className="grid place-items-center w-7 h-7 rounded-md shrink-0 transition-colors"
              style={{ color: copied ? 'var(--live)' : 'var(--text-3)' }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{ borderBottom: '1px solid var(--border)', fontSize: 'var(--step--2)' }}
          >
            <span className="font-mono font-semibold" style={{ color: 'var(--live)' }}>
              ● {result?.status === 400 ? '400 Bad Request' : '200 OK'} · simulated
            </span>
            <span className="font-mono" style={{ color: 'var(--text-3)' }}>
              application/json
            </span>
          </div>

          <pre
            aria-live="polite"
            className="p-4 overflow-x-auto font-mono flex-1"
            style={{
              fontSize: 'var(--step--1)',
              lineHeight: 1.7,
              opacity: running ? 0.35 : 1,
              transition: 'opacity 0.18s var(--ease)',
              margin: 0,
            }}
          >
            <code>{highlight(body)}</code>
          </pre>
        </div>
        </Emerge>
      </div>
    </Section>
  );
};
