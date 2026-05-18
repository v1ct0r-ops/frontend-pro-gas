import type { EstadoCuadre } from "@/types/api";

// ─── Dashboard Resumen ────────────────────────────────────────────────────────

export interface CajaHoyResumen {
  existe: boolean;
  is_closed: boolean | null;
  estado_cuadre: EstadoCuadre | null;
  total_ventas_calc: number | null;
  efectivo_rendido: number | null;
}

export interface VentasMesResumen {
  total_clp: number | null;
  kilos_totales: number;
}

export interface SaludCuadresResumen {
  cierres_con_faltante: number;
}

export interface ElementoGrafico {
  fecha: string;
  kilos_vendidos: number;
  kilos_ingresados: number;
}

export interface DashboardResumen {
  caja_hoy: CajaHoyResumen;
  ventas_mes_actual: VentasMesResumen;
  salud_cuadres: SaludCuadresResumen;
  grafico_7_dias: ElementoGrafico[];
}
