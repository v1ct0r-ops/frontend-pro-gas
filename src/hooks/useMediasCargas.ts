import { useState, useCallback, useEffect } from "react";
import { crearMediaCarga as crearMediaCargaApi, listarHistorial } from "@/services/mediasCargas";
import type { MediaCargaCreate, HistorialAuditoria } from "@/types/api";

export function useMediasCargas() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crearMediaCarga(payload: MediaCargaCreate): Promise<boolean> {
    setEnviando(true);
    setError(null);
    try {
      await crearMediaCargaApi(payload);
      return true;
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail ?? "No se pudo registrar la media carga. Verifica los datos e intenta de nuevo.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { crearMediaCarga, enviando, error };
}

export function useHistorialAuditoria() {
  const [historial, setHistorial] = useState<HistorialAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await listarHistorial();
      setHistorial(data);
    } catch {
      setError("No se pudo cargar el historial de auditoría.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { historial, cargando, error, refetch };
}
