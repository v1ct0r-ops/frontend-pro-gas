import { useCallback, useEffect, useState } from "react";
import {
  listarClientes,
  crearCliente as crearClienteApi,
  editarCliente as editarClienteApi,
  eliminarCliente as eliminarClienteApi,
} from "@/services/clientes";
import type { Cliente, ClienteCreate, ClienteUpdate } from "@/types/api";

const PAGE_SIZE = 5;

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await listarClientes(page, PAGE_SIZE);
      setClientes(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setError("No se pudo cargar la lista de clientes.");
    } finally {
      setCargando(false);
    }
  }, [page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function crearCliente(payload: ClienteCreate): Promise<void> {
    await crearClienteApi(payload);
    setPage(1);
    await refetch();
  }

  async function editarCliente(id: number, payload: ClienteUpdate): Promise<void> {
    await editarClienteApi(id, payload);
    setPage(1);
    await refetch();
  }

  async function eliminarCliente(id: number): Promise<void> {
    await eliminarClienteApi(id);
    setPage(1);
    await refetch();
  }

  return {
    clientes,
    total,
    totalPages,
    page,
    setPage,
    cargando,
    error,
    refetch,
    crearCliente,
    editarCliente,
    eliminarCliente,
  };
}
