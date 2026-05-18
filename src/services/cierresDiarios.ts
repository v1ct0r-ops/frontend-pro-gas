import apiClient from "@/lib/api";
import type {
  CierreDiario,
  CierreDiarioCreate,
  CierreDiarioUpdate,
  CierresDiariosListParams,
  PaginatedResponse,
} from "@/types/api";

const BASE = "/api/v1/cierres-diarios";

export async function listarCierres(
  params?: CierresDiariosListParams
): Promise<PaginatedResponse<CierreDiario>> {
  const { data } = await apiClient.get<PaginatedResponse<CierreDiario>>(`${BASE}/`, { params });
  return data;
}

export async function obtenerCierre(id: number): Promise<CierreDiario> {
  const { data } = await apiClient.get<CierreDiario>(`${BASE}/${id}`);
  return data;
}

export async function crearCierre(payload: CierreDiarioCreate): Promise<CierreDiario> {
  const { data } = await apiClient.post<CierreDiario>(`${BASE}/`, payload);
  return data;
}

export async function editarCierre(id: number, payload: CierreDiarioUpdate): Promise<CierreDiario> {
  const { data } = await apiClient.patch<CierreDiario>(`${BASE}/${id}`, payload);
  return data;
}

export async function cerrarCierre(id: number): Promise<CierreDiario> {
  const { data } = await apiClient.patch<CierreDiario>(`${BASE}/${id}/cerrar`);
  return data;
}

export async function eliminarCierre(id: number): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export async function descargarPdfCierre(id: number): Promise<void> {
  const response = await apiClient.get(`${BASE}/${id}/pdf`, { responseType: "blob" });
  const blob = new Blob([response.data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cierre_diario_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
