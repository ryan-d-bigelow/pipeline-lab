import type { RunCompletePayload } from "../types";

interface OutputDisplayProps {
  runResult: RunCompletePayload | null;
  error: string | null;
}

export default function OutputDisplay({ runResult, error }: OutputDisplayProps) {
  if (error) {
    return (
      <div
        style={{
          border: '1px solid var(--signal-red)',
          padding: '10px 12px',
          background: 'rgba(255, 59, 92, 0.05)',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          color: 'var(--signal-red)',
          marginBottom: 4,
          letterSpacing: '0.08em',
          margin: 0,
        }}>
          ERROR
        </p>
        <p style={{ fontSize: 11, color: 'var(--signal-red)', margin: '4px 0 0 0', opacity: 0.8 }}>
          {error}
        </p>
      </div>
    );
  }

  if (!runResult) return null;

  const isCompleted = runResult.status === "completed";
  const output = runResult.output;

  const outputEntries = Object.entries(output).filter(
    ([, v]) => typeof v === "string" && (v as string).length > 0,
  );

  return (
    <div>
      {/* Status + run ID */}
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: isCompleted ? 'var(--phosphor)' : 'var(--signal-red)',
          }}
        >
          [{isCompleted ? 'OK' : 'ERR'}]
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
          {runResult.run_id.slice(0, 8)}
        </span>
      </div>

      {/* Errors */}
      {runResult.errors.length > 0 && (
        <div
          style={{
            border: '1px solid var(--signal-red)',
            padding: '8px 12px',
            marginBottom: 8,
            background: 'rgba(255, 59, 92, 0.05)',
          }}
        >
          {runResult.errors.map((e, i) => (
            <p key={i} style={{ fontSize: 11, color: 'var(--signal-red)', margin: i > 0 ? '4px 0 0 0' : 0 }}>
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Output entries */}
      {outputEntries.length > 0 && (
        <div>
          {outputEntries.map(([key, value]) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 10,
                color: 'var(--text-dim)',
                letterSpacing: '0.06em',
                marginBottom: 4,
                margin: '0 0 4px 0',
              }}>
                {key}
              </p>
              <div
                style={{
                  background: 'var(--void)',
                  border: '1px solid var(--border)',
                  padding: '10px 12px',
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                <p style={{
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {String(value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
