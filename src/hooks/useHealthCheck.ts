import { useState, useEffect, useCallback } from "react";
import apiClient, { HealthCheckResponse } from "@/services/api";

type HealthStatus = "idle" | "loading" | "success" | "error";

interface UseHealthCheckResult {
  status: HealthStatus;
  data: HealthCheckResponse | null;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook that calls GET /api/health and tracks its loading state.
 * Separated from App.tsx to keep the component clean and the logic reusable.
 */
export function useHealthCheck(): UseHealthCheckResult {
  const [status, setStatus] = useState<HealthStatus>("idle");
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const response = await apiClient.get<HealthCheckResponse>("/api/health");
      setData(response.data);
      setStatus("success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { status, data, error, refetch: fetchHealth };
}
