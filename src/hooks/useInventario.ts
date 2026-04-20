import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { Producto } from "@/types/api";

// Hook centralizado de inventario.
// Expone `refetch` para que otros módulos (ej: Medias Cargas) puedan
// actualizar el stock sin recargar la página.
export function useInventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // El backend puede devolver array directo o { items: [...] }
      const { data } = await apiClient.get<Producto[] | { items: Producto[] }>(
        "/api/v1/inventario/"
      );
      const lista = Array.isArray(data) ? data : data.items;
      const ordenada = [...lista].sort((a, b) => {
        const esGruaA = /gr[úu]a/i.test(a.formato);
        const esGruaB = /gr[úu]a/i.test(b.formato);
        if (esGruaA && !esGruaB) return 1;
        if (!esGruaA && esGruaB) return -1;
        return a.peso_kg - b.peso_kg;
      });
      setProductos(ordenada);
    } catch {
      setError("No se pudo cargar el inventario. Verifica tu conexión.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { productos, cargando, error, refetch };
}
