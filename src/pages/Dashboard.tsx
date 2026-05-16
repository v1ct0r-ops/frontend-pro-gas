import { Lock, RefreshCw, Send } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TooltipContentProps, TooltipPayloadEntry } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import type { CajaHoyResumen } from "@/types/dashboard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clpFmt = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function formatFecha(iso: string): string {
  const p = iso.split("-");
  return `${p[2]}/${p[1]}`;
}

function ValorFinanciero({
  valor,
  sinAcceso = false,
}: {
  valor: number | null;
  sinAcceso?: boolean;
}) {
  if (valor === null && sinAcceso) {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground font-normal text-base">
        <Lock className="h-4 w-4 shrink-0" />
        Sin permiso
      </span>
    );
  }
  if (valor === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <>{clpFmt.format(valor)}</>;
}

function BadgeCaja({ caja }: { caja: CajaHoyResumen }) {
  if (!caja.existe) return <Badge variant="outline">Sin cierre</Badge>;
  if (!caja.is_closed) return <Badge>Abierta</Badge>;
  if (caja.estado_cuadre === "faltante")
    return <Badge variant="destructive">Con faltante</Badge>;
  if (caja.estado_cuadre === "sobrante")
    return <Badge variant="secondary">Con sobrante</Badge>;
  if (caja.estado_cuadre === "exacto")
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
        Cuadrada
      </Badge>
    );
  return <Badge variant="secondary">Cerrada</Badge>;
}

// ─── Tooltip del gráfico ──────────────────────────────────────────────────────

function TooltipGrafico({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5 shadow-md text-sm">
      <p className="font-semibold mb-1.5">{String(label ?? "")}</p>
      {(payload as TooltipPayloadEntry[]).map((p, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: p.color ?? "currentColor" }}
          />
          {p.name === "kilos_vendidos" ? "Vendidos" : "Ingresados"}:{" "}
          <span className="font-medium">
            {typeof p.value === "number" ? `${p.value.toFixed(1)} kg` : "—"}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { resumen, cargando, error, refetch, enviandoReporte, dispararReporte } = useDashboard();
  const { hasRole } = useAuth();
  const esSuperAdmin = hasRole("super_admin");

  const cargandoInicial = cargando && !resumen;
  const caja = resumen?.caja_hoy;
  const ventas = resumen?.ventas_mes_actual;
  const salud = resumen?.salud_cuadres;
  const faltantes = salud?.cierres_con_faltante ?? 0;

  const datosGrafico = (resumen?.grafico_7_dias ?? []).map((p) => ({
    ...p,
    fechaCorta: formatFecha(p.fecha),
  }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen operativo del día</p>
        </div>
        <div className="flex items-center gap-2">
          {esSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={dispararReporte}
              disabled={enviandoReporte}
            >
              <Send className={`h-4 w-4 mr-2 ${enviandoReporte ? "animate-pulse" : ""}`} />
              {enviandoReporte ? "Enviando…" : "Enviar Reporte Ahora"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refetch} disabled={cargando}>
            <RefreshCw className={`h-4 w-4 mr-2 ${cargando ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error de red */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Tarjetas KPI ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

        {/* 1 · Estado de Caja */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Caja de Hoy</CardDescription>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-2xl">
                {cargandoInicial
                  ? "…"
                  : !caja?.existe
                  ? "—"
                  : caja.is_closed
                  ? "Cerrada"
                  : "Abierta"}
              </CardTitle>
              {caja && <BadgeCaja caja={caja} />}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {cargandoInicial
                ? "Cargando estado…"
                : !caja?.existe
                ? "No se creó cierre hoy"
                : caja.is_closed
                ? "Sellado — inmutable"
                : "Pendiente de sellado"}
            </p>
          </CardContent>
        </Card>

        {/* 2 · Efectivo Rendido */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Efectivo Rendido Hoy</CardDescription>
            <CardTitle className="text-2xl">
              {cargandoInicial ? (
                "…"
              ) : (
                <ValorFinanciero
                  valor={caja?.efectivo_rendido ?? null}
                  sinAcceso={Boolean(caja?.existe) && caja?.efectivo_rendido === null}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Efectivo declarado en el cierre del día
            </p>
          </CardContent>
        </Card>

        {/* 3 · Ventas del Mes */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventas del Mes</CardDescription>
            <CardTitle className="text-2xl">
              {cargandoInicial ? (
                "…"
              ) : (
                <ValorFinanciero
                  valor={ventas?.total_clp ?? null}
                  sinAcceso={ventas !== undefined && ventas.total_clp === null}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {ventas
                ? `${ventas.kilos_totales.toFixed(1)} kg vendidos este mes`
                : cargandoInicial
                ? "Cargando…"
                : "—"}
            </p>
          </CardContent>
        </Card>

        {/* 4 · Salud de Cuadres */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Salud de Cuadres (7 días)</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle
                className={`text-2xl ${
                  faltantes > 0 ? "text-destructive" : "text-emerald-600"
                }`}
              >
                {cargandoInicial ? "…" : faltantes}
              </CardTitle>
              {salud && (
                <Badge
                  variant={faltantes > 0 ? "destructive" : "secondary"}
                  className={faltantes === 0 ? "bg-emerald-100 text-emerald-800" : ""}
                >
                  {faltantes > 0 ? "Revisar" : "OK"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {cargandoInicial
                ? "Cargando…"
                : faltantes === 0
                ? "Sin faltantes detectados"
                : `${faltantes} cierre${faltantes !== 1 ? "s" : ""} con faltante`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Gráfico 7 días ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad últimos 7 días</CardTitle>
          <CardDescription>
            Kilos vendidos a revendedores vs. kilos ingresados vía medias cargas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargandoInicial ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
              Cargando datos…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart
                data={datosGrafico}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="fechaCorta"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v: number) => `${v} kg`}
                />
                <Tooltip content={TooltipGrafico} />
                <Legend
                  formatter={(value: string) =>
                    value === "kilos_vendidos" ? "Kilos vendidos" : "Kilos ingresados"
                  }
                />
                <Bar
                  dataKey="kilos_vendidos"
                  name="kilos_vendidos"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="kilos_ingresados"
                  name="kilos_ingresados"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
