import type { RunCompletePayload } from "../types";

interface OutputDisplayProps {
  runResult: RunCompletePayload | null;
  error: string | null;
}

export default function OutputDisplay({ runResult, error }: OutputDisplayProps) {
  if (error) {
    return (
      <div className="bg-red-950/50 border border-red-800 rounded-md px-3 py-2">
        <p className="text-xs font-medium text-red-400 mb-1">Error</p>
        <p className="text-xs text-red-300">{error}</p>
      </div>
    );
  }

  if (!runResult) return null;

  const isCompleted = runResult.status === "completed";
  const output = runResult.output;

  // Find the "main" output — the last non-trivial string value
  const outputEntries = Object.entries(output).filter(
    ([, v]) => typeof v === "string" && (v as string).length > 0,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            isCompleted
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {isCompleted ? "completed" : "failed"}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {runResult.run_id.slice(0, 8)}
        </span>
      </div>

      {runResult.errors.length > 0 && (
        <div className="bg-red-950/30 border border-red-900 rounded-md px-3 py-2 space-y-1">
          {runResult.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-400">
              {e}
            </p>
          ))}
        </div>
      )}

      {outputEntries.length > 0 && (
        <div className="space-y-2">
          {outputEntries.map(([key, value]) => (
            <div key={key}>
              <p className="text-[10px] font-medium text-slate-400 mb-0.5">
                {key}
              </p>
              <div className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 max-h-[200px] overflow-y-auto">
                <p className="text-xs text-slate-200 whitespace-pre-wrap">
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
