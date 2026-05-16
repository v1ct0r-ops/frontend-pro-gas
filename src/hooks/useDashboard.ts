import { useCallback, useEffect, useState } from "react";
import { obtenerResumenDashboard } from "@/services/dashboard";
import type { DashboardResumen } from "@/types/dashboard";

export function useDashboard() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerResumenDashboard();
      setResumen(data);
    } catch {
      setError("No se pudo cargar el resumen del dashboard.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { resumen, cargando, error, refetch };
}
