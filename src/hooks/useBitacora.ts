import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { LlamadaCreate, LlamadaRegistro, Paginated } from "@/types/api";

export function useBitacora() {
  const [llamadas, setLlamadas] = useState<LlamadaRegistro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      // page_size=100: lista completa temporal; migrar a paginación server-side + filtros cuando supere ~100 filas
      const { data } = await apiClient.get<Paginated<LlamadaRegistro>>("/api/v1/bitacora/", {
        params: { page_size: 100 },
      });
      setLlamadas([...data.items].sort((a, b) => b.id - a.id));
    } catch {
      setErrorCarga("No se pudo cargar la bitácora.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function crearLlamada(payload: LlamadaCreate): Promise<boolean> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await apiClient.post("/api/v1/bitacora/", payload);
      await refetch();
      return true;
    } catch {
      setErrorEnvio("No se pudo registrar la llamada. Verifica los datos e intenta de nuevo.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { llamadas, cargando, enviando, errorCarga, errorEnvio, refetch, crearLlamada };
}
