import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api";
import type { Paginated, Usuario, UsuarioCreate, UsuarioUpdate } from "@/types/api";

const PAGE_SIZE = 5;

function extractBackendMessage(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response
  ) {
    const data = (err.response as { data: unknown }).data;
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === "string") return detail;
    }
  }
  return "";
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Paginated<Usuario>>("/api/v1/usuarios/", {
        params: { page, page_size: PAGE_SIZE },
      });
      setUsuarios(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setError("No se pudo cargar la lista de usuarios.");
    } finally {
      setCargando(false);
    }
  }, [page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function crearUsuario(payload: UsuarioCreate): Promise<void> {
    await apiClient.post<Usuario>("/api/v1/usuarios/", payload);
    setPage(1);
    await refetch();
  }

  async function editarUsuario(id: number, payload: UsuarioUpdate): Promise<void> {
    await apiClient.patch<Usuario>(`/api/v1/usuarios/${id}`, payload);
    await refetch();
  }

  async function eliminarUsuario(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/usuarios/${id}`);
    await refetch();
  }

  async function toggleEstado(usuario: Usuario): Promise<void> {
    await apiClient.patch<Usuario>(`/api/v1/usuarios/${usuario.id}`, {
      estado: !usuario.estado,
    });
    await refetch();
  }

  return {
    usuarios,
    total,
    totalPages,
    page,
    setPage,
    cargando,
    error,
    refetch,
    crearUsuario,
    editarUsuario,
    eliminarUsuario,
    toggleEstado,
    extractBackendMessage,
  };
}
