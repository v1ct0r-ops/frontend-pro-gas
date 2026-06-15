import { useState, useCallback, useEffect } from "react";
import { crearMediaCarga as crearMediaCargaApi, listarHistorial, anularMediaCarga as anularMediaCargaApi } from "@/services/mediasCargas";
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
  const [anulando, setAnulando] = useState<Set<number>>(new Set());

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

  const anular = useCallback(
    async (mediaCargaId: number): Promise<{ ok: boolean; status?: number; detail?: string }> => {
      setAnulando((prev) => new Set(prev).add(mediaCargaId));
      try {
        await anularMediaCargaApi(mediaCargaId);
        await refetch();
        return { ok: true };
      } catch (err) {
        const e = err as { response?: { status?: number; data?: { detail?: string } } };
        return { ok: false, status: e.response?.status, detail: e.response?.data?.detail };
      } finally {
        setAnulando((prev) => {
          const next = new Set(prev);
          next.delete(mediaCargaId);
          return next;
        });
      }
    },
    [refetch],
  );

  return { historial, cargando, error, refetch, anular, anulando };
}
