import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { Usuario, UsuarioCreate, UsuarioUpdate } from "@/types/api";

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Usuario[] | { items: Usuario[] }>("/api/v1/usuarios/");
      const lista = Array.isArray(data) ? data : data.items;
      setUsuarios(lista);
    } catch {
      setError("No se pudo cargar la lista de usuarios.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function crearUsuario(payload: UsuarioCreate): Promise<void> {
    await apiClient.post<Usuario>("/api/v1/usuarios/", payload);
    await refetch();
  }

  async function editarUsuario(id: number, payload: UsuarioUpdate): Promise<void> {
    await apiClient.patch<Usuario>(`/api/v1/usuarios/${id}`, payload);
    await refetch();
  }

  return { usuarios, cargando, error, refetch, crearUsuario, editarUsuario };
}
