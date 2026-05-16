import apiClient from "@/lib/api";
import type { DashboardResumen } from "@/types/dashboard";

const BASE = "/api/v1/dashboard";

export async function obtenerResumenDashboard(): Promise<DashboardResumen> {
  const { data } = await apiClient.get<DashboardResumen>(`${BASE}/resumen`);
  return data;
}

export async function enviarReporteDiario(
  emailDestino?: string
): Promise<{ mensaje: string }> {
  const body = emailDestino ? { email_destino: emailDestino } : {};
  const { data } = await apiClient.post<{ mensaje: string }>(
    "/api/v1/reportes/enviar-diario",
    body
  );
  return data;
}
