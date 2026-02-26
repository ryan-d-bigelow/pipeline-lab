import { useCallback, useEffect, useState } from "react";
import { listPipelines, getPipelineConfig } from "../api";
import type { PipelineConfig, PipelineListItem } from "../types";

interface UsePipelinesResult {
  pipelines: PipelineListItem[];
  selectedName: string;
  config: PipelineConfig | null;
  loading: boolean;
  error: string | null;
  selectPipeline: (name: string) => void;
}

export function usePipelines(): UsePipelinesResult {
  const [pipelines, setPipelines] = useState<PipelineListItem[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPipelines()
      .then((list) => {
        if (cancelled) return;
        setPipelines(list);
        const defaultName =
          list.find((p) => p.name === "chain")?.name ?? list[0]?.name ?? "";
        if (defaultName) {
          setSelectedName(defaultName);
          return getPipelineConfig(defaultName).then((cfg) => {
            if (!cancelled) setConfig(cfg);
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectPipeline = useCallback((name: string) => {
    setSelectedName(name);
    setConfig(null);
    setError(null);
    getPipelineConfig(name)
      .then(setConfig)
      .catch((err: unknown) => setError(String(err)));
  }, []);

  return { pipelines, selectedName, config, loading, error, selectPipeline };
}
