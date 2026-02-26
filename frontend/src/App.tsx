import { useState } from "react";
import type { PipelineConfig, StepState } from "./types";
import PipelineGraph from "./components/PipelineGraph";
import RunPanel from "./components/RunPanel";

export default function App() {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({});

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pipeline Lab</h1>
        <span className="subtitle">LangGraph Pipeline Visualizer</span>
      </header>

      <main className="app-main">
        <PipelineGraph config={config} stepStates={stepStates} />
        <RunPanel
          onConfigLoaded={setConfig}
          onStepStatesChange={setStepStates}
        />
      </main>
    </div>
  );
}
