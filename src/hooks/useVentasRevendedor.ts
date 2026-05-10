import { useState } from "react";
import apiClient from "@/lib/api";
import type { VentaRevendedor, VentaRevendedorCreate } from "@/types/api";

type PydanticError = { msg?: string };

export function useVentasRevendedor() {
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  async function registrarVenta(payload: VentaRevendedorCreate): Promise<VentaRevendedor | null> {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const { data } = await apiClient.post<VentaRevendedor>("/api/v1/ventas-revendedor/", payload);
      return data;
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      if (Array.isArray(detail)) {
        setErrorEnvio((detail as PydanticError[]).map((e) => e.msg ?? "Error").join(". "));
      } else if (typeof detail === "string") {
        setErrorEnvio(detail);
      } else {
        setErrorEnvio("Error al registrar la venta. Intenta de nuevo.");
      }
      return null;
    } finally {
      setEnviando(false);
    }
  }

  return { enviando, errorEnvio, registrarVenta };
}
