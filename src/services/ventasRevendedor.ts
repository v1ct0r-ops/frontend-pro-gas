import apiClient from "@/lib/api";
import type {
  VentaRevendedor,
  VentaRevendedorCreate,
  VentaRevendedorPatch,
  VentasRevendedorListParams,
  Paginated,
} from "@/types/api";

const BASE = "/api/v1/ventas-revendedor";

export async function listarVentasRevendedor(
  params?: VentasRevendedorListParams
): Promise<Paginated<VentaRevendedor>> {
  const { data } = await apiClient.get<Paginated<VentaRevendedor>>(`${BASE}/`, { params });
  return data;
}

export async function obtenerVentaRevendedor(id: number): Promise<VentaRevendedor> {
  const { data } = await apiClient.get<VentaRevendedor>(`${BASE}/${id}`);
  return data;
}

export async function crearVentaRevendedor(payload: VentaRevendedorCreate): Promise<VentaRevendedor> {
  const { data } = await apiClient.post<VentaRevendedor>(`${BASE}/`, payload);
  return data;
}

export async function editarVentaRevendedor(
  id: number,
  payload: VentaRevendedorPatch
): Promise<VentaRevendedor> {
  const { data } = await apiClient.patch<VentaRevendedor>(`${BASE}/${id}`, payload);
  return data;
}

export async function eliminarVentaRevendedor(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export async function descargarPdfVentaRevendedor(id: number): Promise<void> {
  const response = await apiClient.get(`${BASE}/${id}/pdf`, { responseType: "blob" });
  const blob = new Blob([response.data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
