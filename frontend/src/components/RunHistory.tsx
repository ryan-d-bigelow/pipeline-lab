import type { RunRecord, RunStatus } from "../types";

interface RunHistoryProps {
  runs: RunRecord[];
  onSelectRun: (run: RunRecord) => void;
}

const STATUS_BADGE: Record<RunStatus, { color: string; label: string }> = {
  pending: { color: "bg-yellow-600", label: "pending" },
  running: { color: "bg-blue-600", label: "running" },
  completed: { color: "bg-emerald-600", label: "done" },
  failed: { color: "bg-red-600", label: "failed" },
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
      <div className="text-xs text-slate-500 py-2">No runs yet</div>
    );
  }

  return (
    <div className="space-y-1 max-h-[240px] overflow-y-auto">
      {runs.map((run) => {
        const badge = STATUS_BADGE[run.status];
        return (
          <button
            key={run.id}
            onClick={() => onSelectRun(run)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded
                       hover:bg-slate-700/50 transition-colors text-left group"
          >
            <span
              className={`${badge.color} text-white text-[9px] font-medium
                         px-1.5 py-0.5 rounded shrink-0`}
            >
              {badge.label}
            </span>
            <span className="text-xs text-slate-300 truncate flex-1">
              {run.pipeline_name}
            </span>
            <span className="text-[10px] text-slate-500 shrink-0">
              {formatTime(run.created_at)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
