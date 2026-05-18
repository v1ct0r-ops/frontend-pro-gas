import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { obtenerResumenDashboard, enviarReporteDiario } from "@/services/dashboard";
import type { DashboardResumen } from "@/types/dashboard";

export function useDashboard() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviandoReporte, setEnviandoReporte] = useState(false);

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

  const dispararReporte = useCallback(async (emailDestino?: string) => {
    setEnviandoReporte(true);
    try {
      const { mensaje } = await enviarReporteDiario(emailDestino);
      toast.success(mensaje);
    } catch {
      toast.error("No se pudo enviar el reporte. Intente nuevamente.");
    } finally {
      setEnviandoReporte(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { resumen, cargando, error, refetch, enviandoReporte, dispararReporte };
}
