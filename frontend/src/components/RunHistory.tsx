import type { RunRecord, RunStatus } from "../types";

interface RunHistoryProps {
  runs: RunRecord[];
  onSelectRun: (run: RunRecord) => void;
}

const STATUS_CONFIG: Record<RunStatus, { color: string; label: string }> = {
  pending: { color: 'var(--amber)', label: 'pending' },
  running: { color: 'var(--amber)', label: 'running' },
  completed: { color: 'var(--phosphor)', label: 'done' },
  failed: { color: 'var(--signal-red)', label: 'failed' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RunHistory({ runs, onSelectRun }: RunHistoryProps) {
  if (runs.length === 0) {
    return (
      <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '4px 0' }}>
        No signals recorded
      </div>
    );
  }

  return (
    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
      {runs.map((run) => {
        const cfg = STATUS_CONFIG[run.status];
        return (
          <button
            key={run.id}
            onClick={() => onSelectRun(run)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 8px',
              border: 'none',
              borderLeft: `3px solid ${cfg.color}`,
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-mono)',
              marginBottom: 2,
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-raised)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: 9, color: cfg.color, fontWeight: 500, minWidth: 44 }}>
              ● {cfg.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-primary)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {run.pipeline_name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>
              {formatTime(run.created_at)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
