import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { CierreDiario, CierreDiarioCreate, CerrarCierrePayload } from "@/types/api";

export function useCierreDiarios() {
  const [cierres, setCierres] = useState<CierreDiario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data } = await apiClient.get<CierreDiario[] | { items: CierreDiario[] }>(
        "/api/v1/cierres-diarios/"
      );
      const lista = Array.isArray(data) ? data : data.items;
      setCierres(lista.sort((a, b) => b.id - a.id));
    } catch {
      setErrorCarga("No se pudo cargar los cierres diarios.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function crearCierre(payload: CierreDiarioCreate): Promise<CierreDiario | null> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const { data } = await apiClient.post<CierreDiario>("/api/v1/cierres-diarios/", {
        ...payload,
        fecha: new Date().toISOString(),
      });
      await refetch();
      return data;
    } catch {
      setErrorEnvio("No se pudo registrar el cierre.");
      return null;
    } finally {
      setEnviando(false);
    }
  }

  // PATCH /api/v1/cierres-diarios/{id}/cerrar
  async function cerrarCierre(id: number, payload: CerrarCierrePayload): Promise<boolean> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await apiClient.patch(`/api/v1/cierres-diarios/${id}/cerrar`, payload);
      await refetch();
      return true;
    } catch {
      setErrorEnvio("No se pudo sellar el cierre.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { cierres, cargando, enviando, errorCarga, errorEnvio, refetch, crearCierre, cerrarCierre };
}
