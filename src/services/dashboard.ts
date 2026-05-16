import apiClient from "@/lib/api";
import type { DashboardResumen } from "@/types/dashboard";

const BASE = "/api/v1/dashboard";

export async function obtenerResumenDashboard(): Promise<DashboardResumen> {
  const { data } = await apiClient.get<DashboardResumen>(`${BASE}/resumen`);
  return data;
}
