import apiClient from "@/lib/api";
import type { Cliente, ClienteCreate, ClienteUpdate, Paginated } from "@/types/api";

const BASE = "/api/v1/clientes";

export async function listarClientes(
  page: number,
  pageSize: number
): Promise<Paginated<Cliente>> {
  const { data } = await apiClient.get<Paginated<Cliente>>(`${BASE}/`, {
    params: { page, page_size: pageSize },
  });
  return data;
}

export async function buscarClientes(
  q: string,
  limit = 10,
  signal?: AbortSignal
): Promise<Cliente[]> {
  const { data } = await apiClient.get<Cliente[]>(`${BASE}/buscar`, {
    params: { q, limit },
    signal,
  });
  return data;
}

export async function obtenerCliente(id: number): Promise<Cliente> {
  const { data } = await apiClient.get<Cliente>(`${BASE}/${id}`);
  return data;
}

export async function crearCliente(payload: ClienteCreate): Promise<Cliente> {
  const { data } = await apiClient.post<Cliente>(`${BASE}/`, payload);
  return data;
}

export async function editarCliente(id: number, payload: ClienteUpdate): Promise<Cliente> {
  const { data } = await apiClient.patch<Cliente>(`${BASE}/${id}`, payload);
  return data;
}

export async function eliminarCliente(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
