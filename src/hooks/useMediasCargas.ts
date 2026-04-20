import { useState } from "react";
import apiClient from "@/lib/api";
import type { MediaCargaCreate } from "@/types/api";

export function useMediasCargas() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crearMediaCarga(payload: MediaCargaCreate): Promise<boolean> {
    setEnviando(true);
    setError(null);
    try {
      await apiClient.post("/api/v1/medias-cargas/", payload);
      return true;
    } catch {
      setError("No se pudo registrar la media carga. Verifica los datos e intenta de nuevo.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  return { crearMediaCarga, enviando, error };
}
