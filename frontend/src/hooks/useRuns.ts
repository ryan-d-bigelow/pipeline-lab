import { useCallback, useEffect, useState } from "react";
import { listRuns } from "../api";
import type { RunRecord } from "../types";

interface UseRunsResult {
  runs: RunRecord[];
  refresh: () => void;
}

export function useRuns(): UseRunsResult {
  const [runs, setRuns] = useState<RunRecord[]>([]);

  const refresh = useCallback(() => {
    listRuns(20)
      .then(setRuns)
      .catch(() => {
        // silently fail — runs list is non-critical
      });
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { runs, refresh };
}
