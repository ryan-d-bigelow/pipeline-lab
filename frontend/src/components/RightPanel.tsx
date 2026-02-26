import type { PipelineConfig, StepState } from "../types";
import DagView from "./DagView";

interface RightPanelProps {
  config: PipelineConfig | null;
  stepStates: Record<string, StepState>;
}

export default function RightPanel({ config, stepStates }: RightPanelProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--void)' }}>
      {config && (
        <div
          className="shrink-0 flex items-center"
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--phosphor-dim)',
              textTransform: 'uppercase' as const,
            }}
          >
            SIGNAL FLOW:{' '}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase' as const,
              marginLeft: 4,
            }}
          >
            {config.name}
          </span>
          <span
            className="ml-auto"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-dim)',
            }}
          >
            [{config.steps.length} steps]
          </span>
        </div>
      )}
      <div
        className="flex-1"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundColor: 'var(--void)',
        }}
      >
        <DagView config={config} stepStates={stepStates} />
      </div>
    </div>
  );
}
