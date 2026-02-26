import type { PipelineConfig, PipelineListItem, RunCompletePayload, RunRecord, StepState } from "../types";
import PipelineSelector from "./PipelineSelector";
import InputForm from "./InputForm";
import RunHistory from "./RunHistory";
import OutputDisplay from "./OutputDisplay";

interface LeftPanelProps {
  pipelines: PipelineListItem[];
  selectedName: string;
  config: PipelineConfig | null;
  userInput: string;
  isRunning: boolean;
  runResult: RunCompletePayload | null;
  error: string | null;
  runs: RunRecord[];
  stepStates: Record<string, StepState>;
  onSelectPipeline: (name: string) => void;
  onInputChange: (value: string) => void;
  onRun: () => void;
  onSelectRun: (run: RunRecord) => void;
}

export default function LeftPanel({
  pipelines,
  selectedName,
  userInput,
  isRunning,
  runResult,
  error,
  runs,
  onSelectPipeline,
  onInputChange,
  onRun,
  onSelectRun,
}: LeftPanelProps) {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-2"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: '0.12em',
            color: 'var(--phosphor)',
            textTransform: 'uppercase' as const,
          }}
        >
          PIPELINE LAB
        </span>
        <span className="cursor-blink" style={{ color: 'var(--phosphor)', fontSize: 13 }}>█</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        {/* Select pipeline section */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase' as const,
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'var(--phosphor-dim)' }}>&gt; </span>SELECT PIPELINE
          </div>
          <PipelineSelector
            pipelines={pipelines}
            selectedName={selectedName}
            disabled={isRunning}
            onSelect={onSelectPipeline}
          />
        </div>

        {/* Input signal section */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase' as const,
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'var(--phosphor-dim)' }}>&gt; </span>INPUT SIGNAL
          </div>
          <InputForm
            userInput={userInput}
            isRunning={isRunning}
            disabled={isRunning || !selectedName}
            onInputChange={onInputChange}
            onRun={onRun}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

        {/* Signal log section */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase' as const,
              marginBottom: 8,
            }}
          >
            SIGNAL LOG
          </div>
          <RunHistory runs={runs} onSelectRun={onSelectRun} />
        </div>

        {/* Output section */}
        {(runResult || error) && (
          <div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 11,
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase' as const,
                marginBottom: 8,
              }}
            >
              OUTPUT
            </div>
            <OutputDisplay runResult={runResult} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
