import apiClient from "@/lib/api";
import type { MediaCarga, MediaCargaCreate, HistorialAuditoria } from "@/types/api";

const BASE = "/api/v1/medias-cargas";

export async function listarMediasCargas(): Promise<MediaCarga[]> {
  const { data } = await apiClient.get<MediaCarga[] | { items: MediaCarga[] }>(`${BASE}/`);
  return Array.isArray(data) ? data : data.items;
}

export async function obtenerMediaCarga(id: number): Promise<MediaCarga> {
  const { data } = await apiClient.get<MediaCarga>(`${BASE}/${id}`);
  return data;
}

export async function crearMediaCarga(payload: MediaCargaCreate): Promise<MediaCarga> {
  const { data } = await apiClient.post<MediaCarga>(`${BASE}/`, payload);
  return data;
}

export async function listarHistorial(): Promise<HistorialAuditoria[]> {
  const { data } = await apiClient.get<HistorialAuditoria[] | { items: HistorialAuditoria[] }>(
    `${BASE}/historial`
  );
  return Array.isArray(data) ? data : data.items;
}

export async function obtenerHistorial(id: number): Promise<HistorialAuditoria> {
  const { data } = await apiClient.get<HistorialAuditoria>(`${BASE}/historial/${id}`);
  return data;
}

export async function descargarPdfHistorial(id: number, numeroGuia: string): Promise<void> {
  const response = await apiClient.get(`${BASE}/historial/${id}/pdf`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `media_carga_${numeroGuia}_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
